import { NextFunction, Request, Response } from 'express';
import { SurveyInput, SurveyQueryFilters, UpdatableAuditStatus } from '../models/types';
import { surveyService } from '../services/survey.service';

export const surveyController = {
  async ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = req.body as SurveyInput[];
      const result = await surveyService.ingestSurveys(req.user!.id, items);
      res.status(201).json({
        success: true,
        data: {
          insertedCount: result.inserted.length,
          skippedDuplicates: result.skippedDuplicates,
          syncedClientIds: result.syncedClientIds,
          surveys: result.inserted,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = (req.validatedQuery ?? req.query) as SurveyQueryFilters;
      const result = await surveyService.getSurveys(filters, {
        id: req.user!.id,
        role: req.user!.role,
      });
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  async analytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = (req.validatedQuery ?? req.query) as {
        constituency?: string;
        ward?: string;
      };
      const summary = await surveyService.getAnalytics(filters, {
        id: req.user!.id,
        role: req.user!.role,
      });
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { status, reason } = req.body as {
        status: UpdatableAuditStatus;
        reason?: string;
      };
      const updated = await surveyService.updateAuditStatus({
        surveyId: id,
        status,
        reviewerId: req.user!.id,
        reason: reason ?? '',
      });
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const logs = await surveyService.getSurveyAuditLogs(id);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  },
};
