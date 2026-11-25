import crypto from 'crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database & Redis before importing app (hoisted safely for Vitest)
const {
  mockQuery,
  mockClientQuery,
  mockRelease,
  revokedJtis,
  analyticsCache,
} = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockClientQuery: vi.fn(),
  mockRelease: vi.fn(),
  revokedJtis: new Set<string>(),
  analyticsCache: new Map<string, unknown>(),
}));

vi.mock('../src/config/database', () => ({
  pool: {
    connect: vi.fn(async () => ({
      query: mockClientQuery,
      release: mockRelease,
    })),
    query: mockQuery,
    end: vi.fn(),
  },
  query: (...args: unknown[]) => mockQuery(...args),
  withTransaction: async <T>(cb: (client: { query: typeof mockClientQuery }) => Promise<T>) => {
    const client = { query: mockClientQuery };
    await client.query('BEGIN');
    try {
      const result = await cb(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  },
  checkDatabaseHealth: vi.fn(async () => true),
}));

vi.mock('../src/config/redis', () => ({
  redisManager: {
    getClient: vi.fn(() => null),
    isReady: vi.fn(() => false),
    ping: vi.fn(async () => true),
    getJson: vi.fn(async (key: string) => analyticsCache.get(key) ?? null),
    setJson: vi.fn(async (key: string, val: unknown) => {
      analyticsCache.set(key, val);
    }),
    deleteByPattern: vi.fn(async () => {
      analyticsCache.clear();
    }),
    revokeTokenJti: vi.fn(async (jti: string) => {
      revokedJtis.add(jti);
    }),
    isTokenJtiRevoked: vi.fn(async (jti: string) => revokedJtis.has(jti)),
    disconnect: vi.fn(async () => undefined),
  },
}));

import { createApp } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

const app = createApp();

const WORKER_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const SURVEY_ID = '33333333-3333-4333-8333-333333333333';

function makeToken(role: 'field_worker' | 'admin') {
  return signAccessToken({
    userId: role === 'admin' ? ADMIN_ID : WORKER_ID,
    email: role === 'admin' ? 'director@matdatapulse.in' : 'rohan.field@matdatapulse.in',
    role,
    fullName: role === 'admin' ? 'Campaign Director' : 'Rohan Kulkarni',
    assignedConstituency: role === 'admin' ? null : 'Shivajinagar',
  });
}

describe('Matdata Pulse Backend API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokedJtis.clear();
    analyticsCache.clear();
  });

  it('GET /health returns 200 with postgres & redis status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.dependencies).toEqual({ postgres: 'up', redis: 'up' });
  });

  it('rejects unauthenticated requests to /api/surveys with 401', async () => {
    const res = await request(app)
      .get('/api/surveys')
      .set('x-test-bypass-ratelimit', '1');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid mobile number and age via Zod on POST /api/surveys', async () => {
    const { token } = makeToken('field_worker');
    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1')
      .send({
        voterFullName: 'A',
        age: 15,
        gender: 'Male',
        mobileNumber: '12345',
        assemblyConstituency: 'Shivajinagar',
        wardNumber: 'Ward 14',
        priorityCivicIssue: 'Water',
        sentimentRating: 'Positive',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ingests a batch array of surveys idempotently inside a transaction', async () => {
    const { token } = makeToken('field_worker');
    const clientId1 = crypto.randomUUID();
    const clientId2 = crypto.randomUUID();
    const now = new Date();

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: SURVEY_ID }] }) // INSERT 1
      .mockResolvedValueOnce({
        rows: [
          {
            id: SURVEY_ID,
            client_survey_id: clientId1,
            collector_id: WORKER_ID,
            collector_name: 'Rohan Kulkarni',
            voter_full_name: 'Rajeshwari Deshpande',
            age: 42,
            gender: 'Female',
            mobile_number: '9823011223',
            assembly_constituency: 'Shivajinagar',
            ward_number: 'Ward 14',
            priority_civic_issue: 'Water',
            sentiment_rating: 'Positive',
            surveyor_notes: 'Good pressure',
            audit_status: 'Pending',
            reviewed_by: null,
            reviewed_by_name: null,
            reviewed_at: null,
            collected_at: now,
            synced_at: now,
            version: 1,
            created_at: now,
            updated_at: now,
          },
        ],
      }) // SELECT inserted 1
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // INSERT 2 (duplicate clientSurveyId)
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1')
      .send([
        {
          clientSurveyId: clientId1,
          voterFullName: 'Rajeshwari Deshpande',
          age: 42,
          gender: 'Female',
          mobileNumber: '9823011223',
          assemblyConstituency: 'Shivajinagar',
          wardNumber: 'Ward 14',
          priorityCivicIssue: 'Water',
          sentimentRating: 'Positive',
          surveyorNotes: 'Good pressure',
        },
        {
          clientSurveyId: clientId2,
          voterFullName: 'Duplicate Sync Retry',
          age: 35,
          gender: 'Male',
          mobileNumber: '9823011999',
          assemblyConstituency: 'Shivajinagar',
          wardNumber: 'Ward 14',
          priorityCivicIssue: 'Roads',
          sentimentRating: 'Neutral',
        },
      ]);

    expect(res.status).toBe(201);
    expect(res.body.data.insertedCount).toBe(1);
    expect(res.body.data.skippedDuplicates).toBe(1);
    expect(res.body.data.syncedClientIds).toEqual([clientId1, clientId2]);
  });

  it('scopes GET /api/surveys to collector_id for field_worker', async () => {
    const { token } = makeToken('field_worker');
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/surveys?constituency=Shivajinagar&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1');

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[0][1]).toContain(WORKER_ID);
  });

  it('forbids field_worker from PATCH /api/surveys/:id/status (RBAC 403)', async () => {
    const { token } = makeToken('field_worker');

    const res = await request(app)
      .patch(`/api/surveys/${SURVEY_ID}/status`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1')
      .send({ status: 'Verified' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows admin to update status using PostgreSQL SELECT ... FOR UPDATE row lock', async () => {
    const { token } = makeToken('admin');
    const now = new Date();

    mockClientQuery
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: SURVEY_ID, audit_status: 'Pending', version: 1 }],
      }) // SELECT ... FOR UPDATE
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE surveys
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT survey_audit_logs
      .mockResolvedValueOnce({
        rows: [
          {
            id: SURVEY_ID,
            client_survey_id: crypto.randomUUID(),
            collector_id: WORKER_ID,
            collector_name: 'Rohan Kulkarni',
            voter_full_name: 'Rajeshwari Deshpande',
            age: 42,
            gender: 'Female',
            mobile_number: '9823011223',
            assembly_constituency: 'Shivajinagar',
            ward_number: 'Ward 14',
            priority_civic_issue: 'Water',
            sentiment_rating: 'Positive',
            surveyor_notes: 'Verified in field',
            audit_status: 'Verified',
            reviewed_by: ADMIN_ID,
            reviewed_by_name: 'Campaign Director',
            reviewed_at: now,
            collected_at: now,
            synced_at: now,
            version: 2,
            created_at: now,
            updated_at: now,
          },
        ],
      }) // SELECT updated DTO
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const res = await request(app)
      .patch(`/api/surveys/${SURVEY_ID}/status`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1')
      .send({ status: 'Verified', reason: 'Phone confirmed with booth worker' });

    expect(res.status).toBe(200);
    expect(res.body.data.auditStatus).toBe('Verified');
    expect(res.body.data.version).toBe(2);

    // Confirm row-level locking SQL was executed
    const lockQueryCall = mockClientQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('FOR UPDATE')
    );
    expect(lockQueryCall).toBeDefined();
  });

  it('returns analytics summary with sentiment percentages and top 3 issues', async () => {
    const { token } = makeToken('admin');
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total: '10',
            verified_count: '6',
            pending_count: '3',
            flagged_count: '1',
            duplicate_count: '0',
            positive_count: '5',
            neutral_count: '2',
            negative_count: '3',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { issue: 'Water', count: '4' },
          { issue: 'Roads', count: '3' },
          { issue: 'Healthcare', count: '2' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ constituencies: ['Kothrud', 'Shivajinagar'], wards: ['Ward 08', 'Ward 14'] }],
      });

    const res = await request(app)
      .get('/api/surveys/analytics')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1');

    expect(res.status).toBe(200);
    expect(res.body.data.totalSurveys).toBe(10);
    expect(res.body.data.sentimentBreakdown.Positive.percentage).toBe(50);
    expect(res.body.data.topIssues).toHaveLength(3);
    expect(res.body.data.topIssues[0].issue).toBe('Water');
  });

  it('revokes JWT jti on logout and rejects subsequent requests with that token', async () => {
    const { token } = makeToken('admin');

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1')
      .send({});
    expect(logoutRes.status).toBe(200);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-bypass-ratelimit', '1');
    expect(meRes.status).toBe(401);
    expect(meRes.body.error.code).toBe('TOKEN_REVOKED');
  });

  it('enforces rate limiting and returns 429 when threshold is exceeded', async () => {
    const { token } = makeToken('field_worker');
    // Hit /api/auth/login (limit 10 in 15 min) 11 times with wrong payload or valid schema
    mockQuery.mockResolvedValue({ rows: [] });
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'ratelimit-test@matdatapulse.in', password: 'password123' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
