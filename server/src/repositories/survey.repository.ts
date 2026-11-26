import crypto from 'crypto';
import { query, withTransaction } from '../config/database';
import {
  AnalyticsSummary,
  CivicIssue,
  SurveyDTO,
  SurveyEntity,
  SurveyInput,
  SurveyQueryFilters,
  UpdatableAuditStatus,
} from '../models/types';
import { AppError } from '../utils/appError';

export function toSurveyDTO(row: SurveyEntity): SurveyDTO {
  return {
    id: row.id,
    clientSurveyId: row.client_survey_id,
    collectorId: row.collector_id,
    collectorName: row.collector_name,
    voterFullName: row.voter_full_name,
    age: row.age,
    gender: row.gender,
    mobileNumber: row.mobile_number,
    state: row.state,
    city: row.city,
    assemblyConstituency: row.assembly_constituency,
    wardNumber: row.ward_number,
    priorityCivicIssue: row.priority_civic_issue,
    sentimentRating: row.sentiment_rating,
    surveyorNotes: row.surveyor_notes,
    auditStatus: row.audit_status,
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewed_by_name ?? null,
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
    collectedAt: row.collected_at.toISOString(),
    syncedAt: row.synced_at.toISOString(),
    version: row.version,
  };
}

const SURVEY_SELECT_FIELDS = `
  s.id,
  s.client_survey_id,
  s.collector_id,
  u.full_name AS collector_name,
  s.voter_full_name,
  s.age,
  s.gender,
  s.mobile_number,
  s.state,
  s.city,
  s.assembly_constituency,
  s.ward_number,
  s.priority_civic_issue,
  s.sentiment_rating,
  s.surveyor_notes,
  s.audit_status,
  s.reviewed_by,
  r.full_name AS reviewed_by_name,
  s.reviewed_at,
  s.collected_at,
  s.synced_at,
  s.version,
  s.created_at,
  s.updated_at
`;

export const surveyRepository = {
  /**
   * Inserts one or more surveys inside an ACID transaction.
   * Uses `ON CONFLICT (collector_id, client_survey_id) DO NOTHING` so offline sync retries
   * are strictly idempotent and never create duplicate cloud records.
   */
  async ingestBatch(
    collectorId: string,
    items: SurveyInput[]
  ): Promise<{
    inserted: SurveyDTO[];
    skippedDuplicates: number;
    syncedClientIds: string[];
  }> {
    return withTransaction(async (client) => {
      const inserted: SurveyDTO[] = [];
      const syncedClientIds: string[] = [];
      let skippedDuplicates = 0;

      for (const item of items) {
        const clientSurveyId = item.clientSurveyId || crypto.randomUUID();
        const collectedAt = item.collectedAt ? new Date(item.collectedAt) : new Date();

        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO surveys (
             client_survey_id, collector_id, voter_full_name, age, gender,
             mobile_number, state, city, assembly_constituency, ward_number,
             priority_civic_issue, sentiment_rating, surveyor_notes, collected_at, synced_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
           ON CONFLICT (collector_id, client_survey_id) DO NOTHING
           RETURNING id`,
          [
            clientSurveyId,
            collectorId,
            item.voterFullName,
            item.age,
            item.gender,
            item.mobileNumber,
            item.state ?? 'Maharashtra',
            item.city ?? 'Pune',
            item.assemblyConstituency,
            item.wardNumber,
            item.priorityCivicIssue,
            item.sentimentRating,
            item.surveyorNotes ?? '',
            collectedAt,
          ]
        );

        syncedClientIds.push(clientSurveyId);

        if (insertRes.rowCount === 0) {
          skippedDuplicates += 1;
          continue;
        }

        const fetched = await client.query<SurveyEntity>(
          `SELECT ${SURVEY_SELECT_FIELDS}
           FROM surveys s
           JOIN users u ON u.id = s.collector_id
           LEFT JOIN users r ON r.id = s.reviewed_by
           WHERE s.id = $1`,
          [insertRes.rows[0].id]
        );

        if (fetched.rows[0]) {
          inserted.push(toSurveyDTO(fetched.rows[0]));
        }
      }

      return { inserted, skippedDuplicates, syncedClientIds };
    });
  },

  async listSurveys(filters: SurveyQueryFilters): Promise<{
    items: SurveyDTO[];
    total: number;
  }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    const addParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filters.collectorId) {
      conditions.push(`s.collector_id = ${addParam(filters.collectorId)}`);
    }
    if (filters.state) {
      conditions.push(`LOWER(s.state) = LOWER(${addParam(filters.state)})`);
    }
    if (filters.city) {
      conditions.push(`LOWER(s.city) = LOWER(${addParam(filters.city)})`);
    }
    if (filters.constituency) {
      conditions.push(`LOWER(s.assembly_constituency) = LOWER(${addParam(filters.constituency)})`);
    }
    if (filters.ward) {
      conditions.push(`LOWER(s.ward_number) = LOWER(${addParam(filters.ward)})`);
    }
    if (filters.sentiment) {
      conditions.push(`s.sentiment_rating = ${addParam(filters.sentiment)}`);
    }
    if (filters.auditStatus) {
      conditions.push(`s.audit_status = ${addParam(filters.auditStatus)}`);
    }
    if (filters.issue) {
      conditions.push(`s.priority_civic_issue = ${addParam(filters.issue)}`);
    }
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      const p1 = addParam(pattern);
      conditions.push(
        `(s.voter_full_name ILIKE ${p1} OR s.ward_number ILIKE ${p1} OR s.assembly_constituency ILIKE ${p1} OR s.city ILIKE ${p1} OR s.state ILIKE ${p1} OR s.mobile_number ILIKE ${p1})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (filters.page - 1) * filters.limit;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM surveys s
       ${whereClause}`,
      params
    );
    const total = Number(countRes.rows[0]?.count ?? '0');

    const limitParam = addParam(filters.limit);
    const offsetParam = addParam(offset);

    const rowsRes = await query<SurveyEntity>(
      `SELECT ${SURVEY_SELECT_FIELDS}
       FROM surveys s
       JOIN users u ON u.id = s.collector_id
       LEFT JOIN users r ON r.id = s.reviewed_by
       ${whereClause}
       ORDER BY s.collected_at DESC, s.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    return {
      items: rowsRes.rows.map(toSurveyDTO),
      total,
    };
  },

  async getAnalytics(filters: {
    state?: string;
    city?: string;
    constituency?: string;
    ward?: string;
    collectorId?: string;
  }): Promise<AnalyticsSummary> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    const addParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filters.collectorId) {
      conditions.push(`collector_id = ${addParam(filters.collectorId)}`);
    }
    if (filters.state) {
      conditions.push(`LOWER(state) = LOWER(${addParam(filters.state)})`);
    }
    if (filters.city) {
      conditions.push(`LOWER(city) = LOWER(${addParam(filters.city)})`);
    }
    if (filters.constituency) {
      conditions.push(`LOWER(assembly_constituency) = LOWER(${addParam(filters.constituency)})`);
    }
    if (filters.ward) {
      conditions.push(`LOWER(ward_number) = LOWER(${addParam(filters.ward)})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const summaryRes = await query<{
      total: string;
      verified_count: string;
      pending_count: string;
      flagged_count: string;
      duplicate_count: string;
      positive_count: string;
      neutral_count: string;
      negative_count: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE audit_status = 'Verified')::text AS verified_count,
         COUNT(*) FILTER (WHERE audit_status = 'Pending')::text AS pending_count,
         COUNT(*) FILTER (WHERE audit_status = 'Flagged')::text AS flagged_count,
         COUNT(*) FILTER (WHERE audit_status = 'Duplicate')::text AS duplicate_count,
         COUNT(*) FILTER (WHERE sentiment_rating = 'Positive')::text AS positive_count,
         COUNT(*) FILTER (WHERE sentiment_rating = 'Neutral')::text AS neutral_count,
         COUNT(*) FILTER (WHERE sentiment_rating = 'Negative')::text AS negative_count
       FROM surveys
       ${whereClause}`,
      params
    );

    const issuesRes = await query<{ issue: CivicIssue; count: string }>(
      `SELECT priority_civic_issue AS issue, COUNT(*)::text AS count
       FROM surveys
       ${whereClause}
       GROUP BY priority_civic_issue
       ORDER BY COUNT(*) DESC, priority_civic_issue ASC
       LIMIT 3`,
      params
    );

    const facetsRes = await query<{
      states: string[] | null;
      cities: string[] | null;
      constituencies: string[] | null;
      wards: string[] | null;
    }>(
      `SELECT
         ARRAY(SELECT DISTINCT state FROM surveys ORDER BY state) AS states,
         ARRAY(SELECT DISTINCT city FROM surveys ORDER BY city) AS cities,
         ARRAY(SELECT DISTINCT assembly_constituency FROM surveys ORDER BY assembly_constituency) AS constituencies,
         ARRAY(SELECT DISTINCT ward_number FROM surveys ORDER BY ward_number) AS wards`
    );

    const row = summaryRes.rows[0];
    const total = Number(row?.total ?? '0');
    const pct = (n: number): number =>
      total === 0 ? 0 : Math.round((n / total) * 1000) / 10;

    const pos = Number(row?.positive_count ?? '0');
    const neu = Number(row?.neutral_count ?? '0');
    const neg = Number(row?.negative_count ?? '0');

    return {
      totalSurveys: total,
      verifiedCount: Number(row?.verified_count ?? '0'),
      pendingCount: Number(row?.pending_count ?? '0'),
      flaggedCount: Number(row?.flagged_count ?? '0'),
      duplicateCount: Number(row?.duplicate_count ?? '0'),
      sentimentBreakdown: {
        Positive: { count: pos, percentage: pct(pos) },
        Neutral: { count: neu, percentage: pct(neu) },
        Negative: { count: neg, percentage: pct(neg) },
      },
      topIssues: issuesRes.rows.map((r) => {
        const c = Number(r.count);
        return {
          issue: r.issue,
          count: c,
          percentage: pct(c),
        };
      }),
      states: facetsRes.rows[0]?.states ?? [],
      cities: facetsRes.rows[0]?.cities ?? [],
      constituencies: facetsRes.rows[0]?.constituencies ?? [],
      wards: facetsRes.rows[0]?.wards ?? [],
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Row-level locked (`SELECT ... FOR UPDATE`) audit status transition.
   * Ensures concurrent admins cannot overwrite each other's audit decisions silently
   * and writes an immutable entry in `survey_audit_logs` within the same transaction.
   */
  async updateStatusWithLock(params: {
    surveyId: string;
    newStatus: UpdatableAuditStatus;
    reviewerId: string;
    reason: string;
  }): Promise<SurveyDTO> {
    return withTransaction(async (client) => {
      const lockRes = await client.query<{ id: string; audit_status: string; version: number }>(
        `SELECT id, audit_status, version
         FROM surveys
         WHERE id = $1
         FOR UPDATE`,
        [params.surveyId]
      );

      const current = lockRes.rows[0];
      if (!current) {
        throw new AppError('Survey record not found', 404, 'SURVEY_NOT_FOUND');
      }

      await client.query(
        `UPDATE surveys
         SET audit_status = $1,
             reviewed_by = $2,
             reviewed_at = NOW(),
             version = version + 1,
             updated_at = NOW()
         WHERE id = $3`,
        [params.newStatus, params.reviewerId, params.surveyId]
      );

      await client.query(
        `INSERT INTO survey_audit_logs (survey_id, actor_id, previous_status, new_status, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          params.surveyId,
          params.reviewerId,
          current.audit_status,
          params.newStatus,
          params.reason,
        ]
      );

      const updated = await client.query<SurveyEntity>(
        `SELECT ${SURVEY_SELECT_FIELDS}
         FROM surveys s
         JOIN users u ON u.id = s.collector_id
         LEFT JOIN users r ON r.id = s.reviewed_by
         WHERE s.id = $1`,
        [params.surveyId]
      );

      return toSurveyDTO(updated.rows[0]);
    });
  },

  async getAuditLogs(surveyId: string): Promise<
    Array<{
      id: string;
      surveyId: string;
      actorId: string;
      actorName: string;
      previousStatus: string;
      newStatus: string;
      reason: string;
      createdAt: string;
    }>
  > {
    const res = await query<{
      id: string;
      survey_id: string;
      actor_id: string;
      actor_name: string;
      previous_status: string;
      new_status: string;
      reason: string;
      created_at: Date;
    }>(
      `SELECT l.id, l.survey_id, l.actor_id, u.full_name AS actor_name,
              l.previous_status, l.new_status, l.reason, l.created_at
       FROM survey_audit_logs l
       JOIN users u ON u.id = l.actor_id
       WHERE l.survey_id = $1
       ORDER BY l.created_at DESC`,
      [surveyId]
    );

    return res.rows.map((row) => ({
      id: row.id,
      surveyId: row.survey_id,
      actorId: row.actor_id,
      actorName: row.actor_name,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      reason: row.reason,
      createdAt: row.created_at.toISOString(),
    }));
  },
};
