import { CheckCircle2, ClipboardCheck, Clock, Activity } from 'lucide-react';
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
            className="bg-white rounded-xl border border-slate-200/90 p-5 animate-pulse space-y-3"
          >
            <div className="h-3.5 w-28 bg-slate-200 rounded" />
            <div className="h-8 w-20 bg-slate-200 rounded" />
            <div className="h-2.5 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const total = analytics?.totalSurveys ?? 0;
  const verified = analytics?.verifiedCount ?? 0;
  const pending = analytics?.pendingCount ?? 0;
  const flagged = analytics?.flaggedCount ?? 0;
  const verifiedRate = total > 0 ? Math.round((verified / total) * 1000) / 10 : 0;
  const posPct = analytics?.sentimentBreakdown.Positive.percentage ?? 0;
  const neuPct = analytics?.sentimentBreakdown.Neutral.percentage ?? 0;
  const negPct = analytics?.sentimentBreakdown.Negative.percentage ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Surveys Collected</span>
          <ClipboardCheck className="h-4 w-4 text-blue-700" />
        </div>
        <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight font-mono-num">
          {total.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {analytics?.constituencies.length ?? 0} constituencies ·{' '}
          {analytics?.wards.length ?? 0} active wards
        </p>
      </div>

      <div
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Verified Submissions</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono-num">
            {verified.toLocaleString()}
          </p>
          <span className="text-xs font-semibold text-emerald-700 font-mono-num">
            {verifiedRate}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            style={{ width: `${Math.min(100, verifiedRate)}%` }}
            className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
          />
        </div>
      </div>

      <div
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Sentiment Ratio (P / N / Neg)</span>
          <Activity className="h-4 w-4 text-slate-600" />
        </div>
        <p className="mt-3 text-xl font-bold text-slate-900 font-mono-num">
          <span className="text-emerald-700">{posPct}%</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="text-slate-600">{neuPct}%</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="text-rose-700">{negPct}%</span>
        </p>
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <div style={{ width: `${posPct}%` }} className="bg-emerald-600 transition-all duration-500" />
          <div style={{ width: `${neuPct}%` }} className="bg-slate-400 transition-all duration-500" />
          <div style={{ width: `${negPct}%` }} className="bg-rose-600 transition-all duration-500" />
        </div>
      </div>

      <div
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
        style={{ animationDelay: '180ms' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Pending Review Queue</span>
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight font-mono-num">
          {pending.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-semibold text-rose-700 font-mono-num">{flagged}</span> flagged for follow-up
        </p>
      </div>
    </div>
  );
}
