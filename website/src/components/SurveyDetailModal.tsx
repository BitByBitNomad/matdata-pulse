import { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { surveyApi } from '../api/surveyApi';
import { Survey, SurveyAuditLog, UpdatableAuditStatus } from '../types/survey';

interface SurveyDetailModalProps {
  survey: Survey | null;
  onClose: () => void;
  onStatusUpdate: (surveyId: string, status: UpdatableAuditStatus, reason: string) => Promise<void>;
}

export function SurveyDetailModal({
  survey,
  onClose,
  onStatusUpdate,
}: SurveyDetailModalProps) {
  const [logs, setLogs] = useState<SurveyAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!survey) return;
    setLoadingLogs(true);
    setReason('');
    surveyApi
      .getAuditLogs(survey.id)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [survey]);

  if (!survey) return null;

  const handleAction = async (status: UpdatableAuditStatus) => {
    setSubmitting(true);
    try {
      await onStatusUpdate(survey.id, status, reason);
      const refreshedLogs = await surveyApi.getAuditLogs(survey.id);
      setLogs(refreshedLogs);
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900">{survey.voterFullName}</h3>
            <p className="text-xs text-slate-500">
              {survey.assemblyConstituency} · {survey.wardNumber} · v{survey.version}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-xs text-slate-500 block">Age / Gender</span>
              <strong className="text-slate-900">
                {survey.age} yrs · {survey.gender}
              </strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-xs text-slate-500 block">Mobile Number</span>
              <strong className="text-slate-900">{survey.mobileNumber}</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-xs text-slate-500 block">Priority Civic Issue</span>
              <strong className="text-indigo-700">{survey.priorityCivicIssue}</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-xs text-slate-500 block">Sentiment Rating</span>
              <strong className="text-slate-900">{survey.sentimentRating}</strong>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Surveyor Notes
            </span>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
              {survey.surveyorNotes || 'No additional notes recorded.'}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Update Audit Status (Current: {survey.auditStatus})
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional audit note (e.g., Verified via booth supervisor)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-2">
              {(['Verified', 'Flagged', 'Duplicate'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={submitting || survey.auditStatus === status}
                  onClick={() => handleAction(status)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    status === 'Verified'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : status === 'Flagged'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  Mark {status}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              <History className="h-3.5 w-3.5" />
              Audit Trail
            </div>
            {loadingLogs ? (
              <p className="text-xs text-slate-500">Loading audit history...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-slate-500">No audit transitions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{log.actorName}</span>{' '}
                      changed <span className="text-slate-600">{log.previousStatus}</span> →{' '}
                      <span className="font-semibold text-indigo-700">{log.newStatus}</span>
                      {log.reason && (
                        <p className="text-slate-600 mt-0.5">Note: {log.reason}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
