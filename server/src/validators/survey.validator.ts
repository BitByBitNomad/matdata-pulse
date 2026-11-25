import { z } from 'zod';

export const genderEnum = z.enum(['Male', 'Female', 'Other']);
export const civicIssueEnum = z.enum([
  'Water',
  'Roads',
  'Electricity',
  'Healthcare',
  'Employment',
]);
export const sentimentEnum = z.enum(['Positive', 'Neutral', 'Negative']);
export const auditStatusEnum = z.enum(['Pending', 'Verified', 'Flagged', 'Duplicate']);
export const updatableAuditStatusEnum = z.enum(['Verified', 'Flagged', 'Duplicate']);

export const singleSurveySchema = z.object({
  clientSurveyId: z.string().uuid('clientSurveyId must be a valid UUID').optional(),
  voterFullName: z
    .string()
    .trim()
    .min(2, 'Voter full name must be at least 2 characters')
    .max(150),
  age: z.coerce
    .number()
    .int('Age must be an integer')
    .min(18, 'Voter must be at least 18 years old')
    .max(120, 'Age cannot exceed 120'),
  gender: genderEnum,
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  assemblyConstituency: z
    .string()
    .trim()
    .min(2, 'Assembly constituency is required')
    .max(120),
  wardNumber: z.string().trim().min(1, 'Ward number is required').max(40),
  priorityCivicIssue: civicIssueEnum,
  sentimentRating: sentimentEnum,
  surveyorNotes: z.string().trim().max(1000).optional().default(''),
  collectedAt: z.string().datetime({ offset: true }).optional(),
});

/**
 * Supports single survey object, raw JSON array of surveys, or `{ surveys: [...] }` batch wrapper.
 */
export const surveyIngestionSchema = z.union([
  singleSurveySchema.transform((item) => [item]),
  z
    .array(singleSurveySchema)
    .min(1, 'Batch must contain at least 1 survey')
    .max(100, 'Batch size cannot exceed 100 surveys per request'),
  z
    .object({
      surveys: z
        .array(singleSurveySchema)
        .min(1, 'Batch must contain at least 1 survey')
        .max(100, 'Batch size cannot exceed 100 surveys per request'),
    })
    .transform((payload) => payload.surveys),
]);

export const surveyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  constituency: z.string().trim().optional(),
  ward: z.string().trim().optional(),
  sentiment: sentimentEnum.optional(),
  auditStatus: auditStatusEnum.optional(),
  issue: civicIssueEnum.optional(),
  search: z.string().trim().max(100).optional(),
  collectorId: z.string().uuid().optional(),
});

export const analyticsQuerySchema = z.object({
  constituency: z.string().trim().optional(),
  ward: z.string().trim().optional(),
});

export const updateSurveyStatusSchema = z.object({
  status: updatableAuditStatusEnum,
  reason: z.string().trim().max(500).optional().default(''),
});

export const surveyIdParamSchema = z.object({
  id: z.string().uuid('Survey ID must be a valid UUID'),
});
