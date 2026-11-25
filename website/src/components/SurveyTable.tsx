import {
  Check,
  ChevronLeft,
  ChevronRight,
  CopyX,
  Eye,
  Flag,
  Search,
  X,
} from 'lucide-react';
import {
  AuditStatus,
  CivicIssue,
  PaginationMeta,
  SentimentRating,
  Survey,
  SurveyFilters,
  UpdatableAuditStatus,
} from '../types/survey';

interface SurveyTableProps {
  surveys: Survey[];
  pagination: PaginationMeta;
  filters: SurveyFilters;
  constituencies: string[];
  wards: string[];
  loading: boolean;
  updatingId: string | null;
  onFiltersChange: (next: Partial<SurveyFilters>) => void;
  onStatusUpdate: (surveyId: string, status: UpdatableAuditStatus) => void;
  onSelectSurvey: (survey: Survey) => void;
}

const SENTIMENT_BADGE: Record<SentimentRating, string> = {
  Positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  Negative: 'bg-rose-50 text-rose-700 border-rose-200',
};

const AUDIT_BADGE: Record<AuditStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Flagged: 'bg-rose-50 text-rose-700 border-rose-200',
  Duplicate: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function SurveyTable({
  surveys,
  pagination,
  filters,
  constituencies,
  wards,
  loading,
  updatingId,
  onFiltersChange,
  onStatusUpdate,
  onSelectSurvey,
}: SurveyTableProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.constituency ||
      filters.ward ||
      filters.sentiment ||
      filters.auditStatus ||
      filters.issue
  );

  const resetFilters = () => {
    onFiltersChange({
      page: 1,
      search: '',
      constituency: '',
      ward: '',
      sentiment: '',
      auditStatus: '',
      issue: '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Field Survey Submissions
            </h3>
            <p className="text-xs text-slate-500">
              Showing {surveys.length} of {pagination.total} synced voter records
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
              placeholder="Search voter name, ward, or mobile..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.constituency ?? ''}
            onChange={(e) => onFiltersChange({ constituency: e.target.value, page: 1 })}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Constituencies</option>
            {constituencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.ward ?? ''}
            onChange={(e) => onFiltersChange({ ward: e.target.value, page: 1 })}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Wards</option>
            {wards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <select
            value={filters.sentiment ?? ''}
            onChange={(e) =>
              onFiltersChange({
                sentiment: e.target.value as SentimentRating | '',
                page: 1,
              })
            }
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          <select
            value={filters.auditStatus ?? ''}
            onChange={(e) =>
              onFiltersChange({
                auditStatus: e.target.value as AuditStatus | '',
                page: 1,
              })
            }
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Audit Status</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Flagged">Flagged</option>
            <option value="Duplicate">Duplicate</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1">Civic Issue:</span>
          {(['', 'Water', 'Roads', 'Electricity', 'Healthcare', 'Employment'] as const).map(
            (issueOption) => {
              const active = (filters.issue ?? '') === issueOption;
              return (
                <button
                  key={issueOption || 'all'}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ issue: issueOption as CivicIssue | '', page: 1 })
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {issueOption || 'All Issues'}
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Voter</th>
              <th className="py-3 px-4">Constituency & Ward</th>
              <th className="py-3 px-4">Civic Issue</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4">Collector</th>
              <th className="py-3 px-4">Audit Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-32 bg-slate-200 rounded mb-1.5" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-7 w-28 bg-slate-200 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : surveys.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  No survey submissions match the current filters.
                </td>
              </tr>
            ) : (
              surveys.map((survey) => {
                const isUpdating = updatingId === survey.id;
                return (
                  <tr
                    key={survey.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {survey.voterFullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {survey.age} yrs · {survey.gender} · {survey.mobileNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {survey.assemblyConstituency}
                      </div>
                      <div className="text-xs text-slate-500">{survey.wardNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {survey.priorityCivicIssue}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SENTIMENT_BADGE[survey.sentimentRating]}`}
                      >
                        {survey.sentimentRating}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-700">
                        {survey.collectorName || 'Field Collector'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(survey.collectedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${AUDIT_BADGE[survey.auditStatus]}`}
                      >
                        {survey.auditStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={isUpdating || survey.auditStatus === 'Verified'}
                          onClick={() => onStatusUpdate(survey.id, 'Verified')}
                          title="Verify Survey"
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || survey.auditStatus === 'Flagged'}
                          onClick={() => onStatusUpdate(survey.id, 'Flagged')}
                          title="Flag Survey"
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || survey.auditStatus === 'Duplicate'}
                          onClick={() => onStatusUpdate(survey.id, 'Duplicate')}
                          title="Mark Duplicate"
                          className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                        >
                          <CopyX className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSurvey(survey)}
                          title="Inspect Details & Audit History"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          Page <strong className="text-slate-900">{pagination.page}</strong> of{' '}
          <strong className="text-slate-900">{pagination.totalPages}</strong> (
          {pagination.total} records)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onFiltersChange({ page: pagination.page - 1 })}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => onFiltersChange({ page: pagination.page + 1 })}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
