import {
  AnalyticsSummary,
  PaginationMeta,
  Survey,
  SurveyAuditLog,
  SurveyFilters,
  UpdatableAuditStatus,
} from '../types/survey';
import { apiClient } from './client';

export const surveyApi = {
  async list(filters: SurveyFilters): Promise<{
    items: Survey[];
    pagination: PaginationMeta;
  }> {
    const params: Record<string, string | number> = {
      page: filters.page,
      limit: filters.limit,
    };
    if (filters.state) params.state = filters.state;
    if (filters.city) params.city = filters.city;
    if (filters.constituency) params.constituency = filters.constituency;
    if (filters.ward) params.ward = filters.ward;
    if (filters.sentiment) params.sentiment = filters.sentiment;
    if (filters.auditStatus) params.auditStatus = filters.auditStatus;
    if (filters.issue) params.issue = filters.issue;
    if (filters.search?.trim()) params.search = filters.search.trim();

    const res = await apiClient.get<{
      success: boolean;
      data: Survey[];
      pagination: PaginationMeta;
    }>('/surveys', { params });

    return {
      items: res.data.data,
      pagination: res.data.pagination,
    };
  },

  async analytics(filters?: {
    state?: string;
    city?: string;
    constituency?: string;
    ward?: string;
  }): Promise<AnalyticsSummary> {
    const params: Record<string, string> = {};
    if (filters?.state) params.state = filters.state;
    if (filters?.city) params.city = filters.city;
    if (filters?.constituency) params.constituency = filters.constituency;
    if (filters?.ward) params.ward = filters.ward;

    const res = await apiClient.get<{ success: boolean; data: AnalyticsSummary }>(
      '/surveys/analytics',
      { params }
    );
    return res.data.data;
  },

  async updateStatus(
    id: string,
    status: UpdatableAuditStatus,
    reason = ''
  ): Promise<Survey> {
    const res = await apiClient.patch<{ success: boolean; data: Survey }>(
      `/surveys/${id}/status`,
      { status, reason }
    );
    return res.data.data;
  },

  async getAuditLogs(id: string): Promise<SurveyAuditLog[]> {
    const res = await apiClient.get<{ success: boolean; data: SurveyAuditLog[] }>(
      `/surveys/${id}/audit-logs`
    );
    return res.data.data;
  },
};
