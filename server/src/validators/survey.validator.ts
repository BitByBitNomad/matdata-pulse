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

const WARD_REGEX = /^(?:ward\s*[-#]?\s*)?([1-9]\d{0,2})([a-zA-Z]?)$/i;
const PLACE_NAME_REGEX = /^[A-Za-z][A-Za-z0-9\s\-().]{1,119}$/;

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function hasRepeatedSingleChar(value: string): boolean {
  const letters = value.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return letters.length >= 3 && new Set(letters).size === 1;
}

export function normalizeWardNumber(raw: string): string {
  const match = normalizeSpaces(raw).match(WARD_REGEX);
  if (!match) return normalizeSpaces(raw);
  const num = Number(match[1]);
  const suffix = match[2].toUpperCase();
  const padded = num < 10 ? `0${num}` : `${num}`;
  return `Ward ${padded}${suffix}`;
}

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
  state: z
    .string()
    .trim()
    .min(2, 'State name is too short')
    .max(80)
    .regex(/^[A-Za-z][A-Za-z\s&.-]{1,79}$/, 'State must be a valid alphabetic name')
    .transform(normalizeSpaces)
    .optional()
    .default('Maharashtra'),
  city: z
    .string()
    .trim()
    .min(2, 'City/District name is too short')
    .max(80)
    .regex(/^[A-Za-z][A-Za-z\s&.-]{1,79}$/, 'City must be a valid alphabetic name')
    .transform(normalizeSpaces)
    .optional()
    .default('Pune'),
  assemblyConstituency: z
    .string()
    .trim()
    .min(3, 'Assembly constituency must be at least 3 characters')
    .max(120)
    .regex(
      PLACE_NAME_REGEX,
      'Assembly constituency must start with a letter and contain valid name characters'
    )
    .refine(
      (val) => (val.match(/[A-Za-z]/g)?.length ?? 0) >= 3,
      'Assembly constituency must contain at least 3 alphabetic characters'
    )
    .refine(
      (val) => !hasRepeatedSingleChar(val),
      'Enter a valid Assembly Constituency name'
    )
    .transform(normalizeSpaces),
  wardNumber: z
    .string()
    .trim()
    .min(1, 'Ward number is required')
    .max(40)
    .refine((val) => {
      const match = normalizeSpaces(val).match(WARD_REGEX);
      if (!match) return false;
      const num = Number(match[1]);
      return num >= 1 && num <= 300;
    }, 'Ward number must be between 1 and 300 (e.g. "14", "Ward 14", or "14A")')
    .transform(normalizeWardNumber),
  priorityCivicIssue: civicIssueEnum,
  sentimentRating: sentimentEnum,
  surveyorNotes: z.string().trim().max(1000).optional().default(''),
  collectedAt: z.string().datetime({ offset: true }).optional(),
});

/**
 * Supports single survey object, raw JSON array of surveys, or `{ surveys: [...] }` batch wrapper.
 * Normalizes into an array before Zod validation so field-level validation paths stay exact.
 */
export const surveyIngestionSchema = z.preprocess(
  (raw) => {
    if (Array.isArray(raw)) return raw;
    if (
      raw &&
      typeof raw === 'object' &&
      'surveys' in raw &&
      Array.isArray((raw as { surveys: unknown }).surveys)
    ) {
      return (raw as { surveys: unknown[] }).surveys;
    }
    if (raw && typeof raw === 'object') return [raw];
    return raw;
  },
  z
    .array(singleSurveySchema)
    .min(1, 'Batch must contain at least 1 survey')
    .max(100, 'Batch size cannot exceed 100 surveys per request')
);

export const surveyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  constituency: z.string().trim().optional(),
  ward: z.string().trim().optional(),
  sentiment: sentimentEnum.optional(),
  auditStatus: auditStatusEnum.optional(),
  issue: civicIssueEnum.optional(),
  search: z.string().trim().max(100).optional(),
  collectorId: z.string().uuid().optional(),
});

export const analyticsQuerySchema = z.object({
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
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
