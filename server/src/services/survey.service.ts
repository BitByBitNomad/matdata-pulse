import { redisManager } from '../config/redis';
import {
  AnalyticsSummary,
  SurveyInput,
  SurveyQueryFilters,
  UpdatableAuditStatus,
  UserRole,
} from '../models/types';
import { surveyRepository } from '../repositories/survey.repository';

const ANALYTICS_CACHE_TTL_SECONDS = 60;

export const surveyService = {
  async ingestSurveys(collectorId: string, items: SurveyInput[]) {
    const result = await surveyRepository.ingestBatch(collectorId, items);
    await redisManager.deleteByPattern('analytics:*');
    return result;
  },

  async getSurveys(
    filters: SurveyQueryFilters,
    requester: { id: string; role: UserRole }
  ) {
    // Field workers can only inspect their own submissions; admins have full visibility
    const scopedFilters: SurveyQueryFilters = {
      ...filters,
      collectorId:
        requester.role === 'field_worker' ? requester.id : filters.collectorId,
    };

    const { items, total } = await surveyRepository.listSurveys(scopedFilters);
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));

    return {
      items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    };
  },

  async getAnalytics(
    filters: { constituency?: string; ward?: string },
    requester: { id: string; role: UserRole }
  ): Promise<AnalyticsSummary> {
    const scope = requester.role === 'field_worker' ? `worker:${requester.id}` : 'admin';
    const cacheKey = `analytics:${scope}:${filters.constituency || 'all'}:${filters.ward || 'all'}`;

    const cached = await redisManager.getJson<AnalyticsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const summary = await surveyRepository.getAnalytics({
      constituency: filters.constituency,
      ward: filters.ward,
      collectorId: requester.role === 'field_worker' ? requester.id : undefined,
    });

    await redisManager.setJson(cacheKey, summary, ANALYTICS_CACHE_TTL_SECONDS);
    return summary;
  },

  async updateAuditStatus(params: {
    surveyId: string;
    status: UpdatableAuditStatus;
    reviewerId: string;
    reason: string;
  }) {
    const updated = await surveyRepository.updateStatusWithLock({
      surveyId: params.surveyId,
      newStatus: params.status,
      reviewerId: params.reviewerId,
      reason: params.reason,
    });

    await redisManager.deleteByPattern('analytics:*');
    return updated;
  },

  async getSurveyAuditLogs(surveyId: string) {
    return surveyRepository.getAuditLogs(surveyId);
  },
};
