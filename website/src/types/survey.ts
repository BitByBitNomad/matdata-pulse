export type UserRole = 'field_worker' | 'admin';
export type Gender = 'Male' | 'Female' | 'Other';
export type CivicIssue = 'Water' | 'Roads' | 'Electricity' | 'Healthcare' | 'Employment';
export type SentimentRating = 'Positive' | 'Neutral' | 'Negative';
export type AuditStatus = 'Pending' | 'Verified' | 'Flagged' | 'Duplicate';
export type UpdatableAuditStatus = 'Verified' | 'Flagged' | 'Duplicate';

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  assignedConstituency: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Survey {
  id: string;
  clientSurveyId: string;
  collectorId: string;
  collectorName?: string;
  voterFullName: string;
  age: number;
  gender: Gender;
  mobileNumber: string;
  state: string;
  city: string;
  assemblyConstituency: string;
  wardNumber: string;
  priorityCivicIssue: CivicIssue;
  sentimentRating: SentimentRating;
  surveyorNotes: string;
  auditStatus: AuditStatus;
  reviewedBy: string | null;
  reviewedByName?: string | null;
  reviewedAt: string | null;
  collectedAt: string;
  syncedAt: string;
  version: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalyticsSummary {
  totalSurveys: number;
  verifiedCount: number;
  pendingCount: number;
  flaggedCount: number;
  duplicateCount: number;
  sentimentBreakdown: {
    Positive: { count: number; percentage: number };
    Neutral: { count: number; percentage: number };
    Negative: { count: number; percentage: number };
  };
  topIssues: Array<{
    issue: CivicIssue;
    count: number;
    percentage: number;
  }>;
  states: string[];
  cities: string[];
  constituencies: string[];
  wards: string[];
  generatedAt: string;
}

export interface SurveyAuditLog {
  id: string;
  surveyId: string;
  actorId: string;
  actorName: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  createdAt: string;
}

export interface SurveyFilters {
  page: number;
  limit: number;
  state?: string;
  city?: string;
  constituency?: string;
  ward?: string;
  sentiment?: SentimentRating | '';
  auditStatus?: AuditStatus | '';
  issue?: CivicIssue | '';
  search?: string;
}
