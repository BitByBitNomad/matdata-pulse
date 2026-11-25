import { AlertTriangle, BarChart3 } from 'lucide-react';
import { AnalyticsSummary } from '../types/survey';

interface AnalyticsPanelProps {
  analytics: AnalyticsSummary | null;
  loading: boolean;
}

export function AnalyticsPanel({ analytics, loading }: AnalyticsPanelProps) {
  if (loading && !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-48 animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-48 animate-pulse" />
      </div>
    );
  }

  const pos = analytics?.sentimentBreakdown.Positive ?? { count: 0, percentage: 0 };
  const neu = analytics?.sentimentBreakdown.Neutral ?? { count: 0, percentage: 0 };
  const neg = analytics?.sentimentBreakdown.Negative ?? { count: 0, percentage: 0 };
  const topIssues = analytics?.topIssues ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Voter Sentiment Breakdown</h3>
            <p className="text-xs text-slate-500">Real-time mood across synced booth surveys</p>
          </div>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </div>

        <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex mb-5">
          <div
            style={{ width: `${pos.percentage}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Positive: ${pos.percentage}%`}
          />
          <div
            style={{ width: `${neu.percentage}%` }}
            className="bg-slate-400 transition-all duration-300"
            title={`Neutral: ${neu.percentage}%`}
          />
          <div
            style={{ width: `${neg.percentage}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Negative: ${neg.percentage}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-3">
            <span className="text-xs font-medium text-emerald-800">Positive</span>
            <p className="text-lg font-bold text-emerald-900 mt-0.5">{pos.percentage}%</p>
            <p className="text-[11px] text-emerald-700">{pos.count} voters</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-700">Neutral</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{neu.percentage}%</p>
            <p className="text-[11px] text-slate-600">{neu.count} voters</p>
          </div>
          <div className="rounded-lg bg-rose-50/70 border border-rose-100 p-3">
            <span className="text-xs font-medium text-rose-800">Negative</span>
            <p className="text-lg font-bold text-rose-900 mt-0.5">{neg.percentage}%</p>
            <p className="text-[11px] text-rose-700">{neg.count} voters</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top 3 Reported Civic Issues</h3>
            <p className="text-xs text-slate-500">Highest citizen priority concerns in field data</p>
          </div>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>

        {topIssues.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            No civic issue data available yet for the selected filters.
          </div>
        ) : (
          <div className="space-y-3.5">
            {topIssues.map((item, idx) => (
              <div key={item.issue}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800">
                    #{idx + 1} {item.issue}
                  </span>
                  <span className="text-slate-600 tabular-nums">
                    {item.count} mentions ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      idx === 0
                        ? 'bg-indigo-600'
                        : idx === 1
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
