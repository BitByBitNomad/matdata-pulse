import { Router } from 'express';
import { surveyController } from '../controllers/survey.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { syncRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import {
  analyticsQuerySchema,
  surveyIdParamSchema,
  surveyIngestionSchema,
  surveyQuerySchema,
  updateSurveyStatusSchema,
} from '../validators/survey.validator';

const router = Router();

// All survey routes require a valid JWT token
router.use(authenticate);

// Aggregated analytics (must be defined before /:id routes)
router.get(
  '/analytics',
  authorize('admin', 'field_worker'),
  validate(analyticsQuerySchema, 'query'),
  surveyController.analytics
);

// Single or batch survey ingestion from field workers or admins
router.post(
  '/',
  authorize('field_worker', 'admin'),
  syncRateLimiter,
  validate(surveyIngestionSchema, 'body'),
  surveyController.ingest
);

// Paginated & filtered survey listing (role-scoped in service)
router.get(
  '/',
  authorize('admin', 'field_worker'),
  validate(surveyQuerySchema, 'query'),
  surveyController.list
);

// Audit status transition (Campaign Directors / Admins only; uses PG FOR UPDATE row lock)
router.patch(
  '/:id/status',
  authorize('admin'),
  validate(surveyIdParamSchema, 'params'),
  validate(updateSurveyStatusSchema, 'body'),
  surveyController.updateStatus
);

// Audit trail history for a survey (Admins only)
router.get(
  '/:id/audit-logs',
  authorize('admin'),
  validate(surveyIdParamSchema, 'params'),
  surveyController.auditLogs
);

export const surveyRoutes = router;
