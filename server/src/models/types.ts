export type UserRole = 'field_worker' | 'admin';

export type Gender = 'Male' | 'Female' | 'Other';

export type CivicIssue =
  | 'Water'
  | 'Roads'
  | 'Electricity'
  | 'Healthcare'
  | 'Employment';

export type SentimentRating = 'Positive' | 'Neutral' | 'Negative';

export type AuditStatus = 'Pending' | 'Verified' | 'Flagged' | 'Duplicate';

export type UpdatableAuditStatus = 'Verified' | 'Flagged' | 'Duplicate';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  assignedConstituency: string | null;
  jti: string;
  iat: number;
  exp: number;
}

export interface UserEntity {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  assigned_constituency: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  assignedConstituency: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SurveyEntity {
  id: string;
  client_survey_id: string;
  collector_id: string;
  collector_name?: string;
  voter_full_name: string;
  age: number;
  gender: Gender;
  mobile_number: string;
  assembly_constituency: string;
  ward_number: string;
  priority_civic_issue: CivicIssue;
  sentiment_rating: SentimentRating;
  surveyor_notes: string;
  audit_status: AuditStatus;
  reviewed_by: string | null;
  reviewed_by_name?: string | null;
  reviewed_at: Date | null;
  collected_at: Date;
  synced_at: Date;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface SurveyDTO {
  id: string;
  clientSurveyId: string;
  collectorId: string;
  collectorName?: string;
  voterFullName: string;
  age: number;
  gender: Gender;
  mobileNumber: string;
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

export interface SurveyInput {
  clientSurveyId?: string;
  voterFullName: string;
  age: number;
  gender: Gender;
  mobileNumber: string;
  assemblyConstituency: string;
  wardNumber: string;
  priorityCivicIssue: CivicIssue;
  sentimentRating: SentimentRating;
  surveyorNotes: string;
  collectedAt?: string;
}

export interface SurveyQueryFilters {
  page: number;
  limit: number;
  constituency?: string;
  ward?: string;
  sentiment?: SentimentRating;
  auditStatus?: AuditStatus;
  issue?: CivicIssue;
  search?: string;
  collectorId?: string;
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
  constituencies: string[];
  wards: string[];
  generatedAt: string;
}
