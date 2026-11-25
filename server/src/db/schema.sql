-- Matdata Pulse PostgreSQL Schema
-- Requires PostgreSQL 14+ (gen_random_uuid)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('field_worker', 'admin')),
  assigned_constituency VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_survey_id UUID NOT NULL,
  collector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  voter_full_name VARCHAR(150) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  mobile_number VARCHAR(10) NOT NULL CHECK (mobile_number ~ '^\d{10}$'),
  assembly_constituency VARCHAR(120) NOT NULL,
  ward_number VARCHAR(40) NOT NULL,
  priority_civic_issue VARCHAR(40) NOT NULL CHECK (
    priority_civic_issue IN ('Water', 'Roads', 'Electricity', 'Healthcare', 'Employment')
  ),
  sentiment_rating VARCHAR(20) NOT NULL CHECK (
    sentiment_rating IN ('Positive', 'Neutral', 'Negative')
  ),
  surveyor_notes TEXT NOT NULL DEFAULT '',
  audit_status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (
    audit_status IN ('Pending', 'Verified', 'Flagged', 'Duplicate')
  ),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_collector_client_survey UNIQUE (collector_id, client_survey_id)
);

CREATE TABLE IF NOT EXISTS survey_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  previous_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for filtering, analytics, and audit queries
CREATE INDEX IF NOT EXISTS idx_surveys_constituency_ward
  ON surveys (assembly_constituency, ward_number);

CREATE INDEX IF NOT EXISTS idx_surveys_sentiment
  ON surveys (sentiment_rating);

CREATE INDEX IF NOT EXISTS idx_surveys_audit_status
  ON surveys (audit_status);

CREATE INDEX IF NOT EXISTS idx_surveys_priority_issue
  ON surveys (priority_civic_issue);

CREATE INDEX IF NOT EXISTS idx_surveys_collector_collected
  ON surveys (collector_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_surveys_collected_at_desc
  ON surveys (collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_survey_created
  ON survey_audit_logs (survey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
  ON refresh_tokens (user_id);
