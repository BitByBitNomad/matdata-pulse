import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractErrorMessage } from './api/client';
import { surveyApi } from './api/surveyApi';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { KpiCards } from './components/KpiCards';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { SurveyDetailModal } from './components/SurveyDetailModal';
import { SurveyTable } from './components/SurveyTable';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  AnalyticsSummary,
  PaginationMeta,
  Survey,
  SurveyFilters,
  UpdatableAuditStatus,
} from './types/survey';

function DashboardContent() {
  const { user, isLoading: authLoading, logout } = useAuth();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<SurveyFilters>({
    page: 1,
    limit: 15,
    state: '',
    city: '',
    constituency: '',
    ward: '',
    sentiment: '',
    auditStatus: '',
    issue: '',
    search: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search ?? ''), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoadingAnalytics(true);
    try {
      const summary = await surveyApi.analytics({
        state: filters.state || undefined,
        city: filters.city || undefined,
        constituency: filters.constituency || undefined,
        ward: filters.ward || undefined,
      });
      setAnalytics(summary);
      setLastUpdated(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to load analytics'));
    } finally {
      setLoadingAnalytics(false);
    }
  }, [user, filters.state, filters.city, filters.constituency, filters.ward]);

  const fetchSurveys = useCallback(async () => {
    if (!user) return;
    setLoadingSurveys(true);
    setErrorBanner(null);
    try {
      const res = await surveyApi.list({
        ...filters,
        search: debouncedSearch,
      });
      setSurveys(res.items);
      setPagination(res.pagination);
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to load surveys'));
    } finally {
      setLoadingSurveys(false);
    }
  }, [
    user,
    filters.page,
    filters.limit,
    filters.state,
    filters.city,
    filters.constituency,
    filters.ward,
    filters.sentiment,
    filters.auditStatus,
    filters.issue,
    debouncedSearch,
  ]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    void fetchSurveys();
  }, [fetchSurveys]);

  const handleFiltersChange = (partial: Partial<SurveyFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleStatusUpdate = async (
    surveyId: string,
    status: UpdatableAuditStatus,
    reason = ''
  ) => {
    setUpdatingId(surveyId);
    setErrorBanner(null);
    try {
      const updated = await surveyApi.updateStatus(surveyId, status, reason);
      setSurveys((prev) => prev.map((s) => (s.id === surveyId ? updated : s)));
      if (selectedSurvey?.id === surveyId) {
        setSelectedSurvey(updated);
      }
      setToast(`Survey marked as ${status}`);
      setTimeout(() => setToast(null), 3000);
      await fetchAnalytics();
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to update survey status'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] text-slate-600 text-sm">
        Restoring campaign session...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Layout
      user={user}
      refreshing={loadingAnalytics || loadingSurveys}
      lastUpdated={lastUpdated}
      onRefresh={() => {
        void fetchAnalytics();
        void fetchSurveys();
      }}
      onLogout={() => void logout()}
    >
      {errorBanner && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center justify-between gap-3 text-sm text-rose-800 animate-fade-up">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void fetchAnalytics();
              void fetchSurveys();
            }}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0B132B] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 inline-flex items-center gap-2 animate-toast-in">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 animate-fade-up">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Campaign Telemetry Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live voter feedback metrics and field verification pipeline
          </p>
        </div>
      </div>

      <KpiCards analytics={analytics} loading={loadingAnalytics} />

      <AnalyticsPanel analytics={analytics} loading={loadingAnalytics} />

      <SurveyTable
        surveys={surveys}
        pagination={pagination}
        filters={filters}
        states={analytics?.states ?? []}
        cities={analytics?.cities ?? []}
        constituencies={analytics?.constituencies ?? []}
        wards={analytics?.wards ?? []}
        loading={loadingSurveys}
        updatingId={updatingId}
        onFiltersChange={handleFiltersChange}
        onStatusUpdate={(id, status) => void handleStatusUpdate(id, status)}
        onSelectSurvey={setSelectedSurvey}
      />

      <SurveyDetailModal
        survey={selectedSurvey}
        onClose={() => setSelectedSurvey(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
