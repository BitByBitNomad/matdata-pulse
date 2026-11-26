import { AnalyticsSummary } from '../types/survey';

interface AnalyticsPanelProps {
  analytics: AnalyticsSummary | null;
  loading: boolean;
}

export function AnalyticsPanel({ analytics, loading }: AnalyticsPanelProps) {
  if (loading && !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 h-52 animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 h-52 animate-pulse" />
      </div>
    );
  }

  const pos = analytics?.sentimentBreakdown.Positive ?? { count: 0, percentage: 0 };
  const neu = analytics?.sentimentBreakdown.Neutral ?? { count: 0, percentage: 0 };
  const neg = analytics?.sentimentBreakdown.Negative ?? { count: 0, percentage: 0 };
  const topIssues = analytics?.topIssues ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs animate-fade-up"
        style={{ animationDelay: '160ms' }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Voter Sentiment Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated mood across captured household responses
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-400 font-mono-num">
            N = {analytics?.totalSurveys ?? 0}
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex mb-5">
          <div
            style={{ width: `${pos.percentage}%` }}
            className="bg-emerald-600 transition-all duration-500 ease-out"
            title={`Positive: ${pos.percentage}%`}
          />
          <div
            style={{ width: `${neu.percentage}%` }}
            className="bg-slate-400 transition-all duration-500 ease-out"
            title={`Neutral: ${neu.percentage}%`}
          />
          <div
            style={{ width: `${neg.percentage}%` }}
            className="bg-rose-600 transition-all duration-500 ease-out"
            title={`Negative: ${neg.percentage}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">Positive</span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono-num">
              {pos.percentage}%
            </p>
            <p className="text-[11px] text-slate-500 font-mono-num">{pos.count} voters</p>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Neutral</span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono-num">
              {neu.percentage}%
            </p>
            <p className="text-[11px] text-slate-500 font-mono-num">{neu.count} voters</p>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              <span className="text-xs font-semibold text-slate-700">Negative</span>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono-num">
              {neg.percentage}%
            </p>
            <p className="text-[11px] text-slate-500 font-mono-num">{neg.count} voters</p>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs animate-fade-up"
        style={{ animationDelay: '220ms' }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 3 Priority Civic Issues</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Most frequently escalated concerns by citizens
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Ranked</span>
        </div>

        {topIssues.length === 0 ? (
          <div className="text-xs text-slate-500 py-10 text-center">
            No civic issue data matches the current scope.
          </div>
        ) : (
          <div className="space-y-4">
            {topIssues.map((item, idx) => (
              <div key={item.issue}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-slate-100 text-slate-700 font-mono-num text-[11px] inline-flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {item.issue}
                  </span>
                  <span className="text-slate-600 font-mono-num">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      idx === 0
                        ? 'bg-blue-700'
                        : idx === 1
                          ? 'bg-slate-700'
                          : 'bg-amber-600'
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
