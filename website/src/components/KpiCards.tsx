import { CheckCircle2, ClipboardList, Clock, TrendingUp } from 'lucide-react';
import { AnalyticsSummary } from '../types/survey';

interface KpiCardsProps {
  analytics: AnalyticsSummary | null;
  loading: boolean;
}

export function KpiCards({ analytics, loading }: KpiCardsProps) {
  if (loading && !analytics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3"
          >
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-8 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const total = analytics?.totalSurveys ?? 0;
  const verified = analytics?.verifiedCount ?? 0;
  const pending = analytics?.pendingCount ?? 0;
  const flagged = analytics?.flaggedCount ?? 0;
  const verifiedRate = total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0';
  const posPct = analytics?.sentimentBreakdown.Positive.percentage ?? 0;
  const neuPct = analytics?.sentimentBreakdown.Neutral.percentage ?? 0;
  const negPct = analytics?.sentimentBreakdown.Negative.percentage ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Surveys Collected
          </span>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-slate-500">
          Across {analytics?.constituencies.length ?? 0} constituencies &{' '}
          {analytics?.wards.length ?? 0} wards
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Verified Count
          </span>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{verified.toLocaleString()}</p>
        <p className="mt-1 text-xs text-emerald-700 font-medium">
          {verifiedRate}% verification rate
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sentiment Distribution Ratio
          </span>
          <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-xl font-bold text-slate-900 tabular-nums">
          <span className="text-emerald-600">{posPct}%</span>
          <span className="text-slate-300 mx-1.5">/</span>
          <span className="text-slate-600">{neuPct}%</span>
          <span className="text-slate-300 mx-1.5">/</span>
          <span className="text-rose-600">{negPct}%</span>
        </p>
        <p className="mt-2 text-xs text-slate-500">Positive / Neutral / Negative</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Audit Queue
          </span>
          <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-slate-900">{pending.toLocaleString()}</p>
        <p className="mt-1 text-xs text-slate-500">
          Pending review · <span className="text-rose-600 font-medium">{flagged} flagged</span>
        </p>
      </div>
    </div>
  );
}
