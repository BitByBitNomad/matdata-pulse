import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool, withTransaction } from '../config/database';
import { logger } from '../utils/logger';
import { runMigrations } from './migrate';

const SEED_USERS = [
  {
    fullName: 'Campaign Director (Admin)',
    email: 'director@matdatapulse.in',
    password: 'Director@2026!',
    role: 'admin',
    assignedConstituency: null,
  },
  {
    fullName: 'Rohan Kulkarni (Field Worker)',
    email: 'rohan.field@matdatapulse.in',
    password: 'Worker@2026!',
    role: 'field_worker',
    assignedConstituency: 'Shivajinagar',
  },
  {
    fullName: 'Sneha Deshmukh (Field Worker)',
    email: 'sneha.field@matdatapulse.in',
    password: 'Worker@2026!',
    role: 'field_worker',
    assignedConstituency: 'Kothrud',
  },
] as const;

const SAMPLE_SURVEYS = [
  {
    voterFullName: 'Rajeshwari Deshpande',
    age: 42,
    gender: 'Female',
    mobileNumber: '9823011223',
    assemblyConstituency: 'Shivajinagar',
    wardNumber: 'Ward 14',
    priorityCivicIssue: 'Water',
    sentimentRating: 'Positive',
    surveyorNotes: 'Appreciated morning water pressure improvements near Gokhale Nagar.',
    auditStatus: 'Verified',
    collectorEmail: 'rohan.field@matdatapulse.in',
  },
  {
    voterFullName: 'Mahesh Bhosale',
    age: 55,
    gender: 'Male',
    mobileNumber: '9823044556',
    assemblyConstituency: 'Shivajinagar',
    wardNumber: 'Ward 14',
    priorityCivicIssue: 'Roads',
    sentimentRating: 'Negative',
    surveyorNotes: 'Concerned about pending resurfacing on Model Colony lane 3.',
    auditStatus: 'Verified',
    collectorEmail: 'rohan.field@matdatapulse.in',
  },
  {
    voterFullName: 'Prakash Joshi',
    age: 34,
    gender: 'Male',
    mobileNumber: '9890123456',
    assemblyConstituency: 'Shivajinagar',
    wardNumber: 'Ward 12',
    priorityCivicIssue: 'Employment',
    sentimentRating: 'Neutral',
    surveyorNotes: 'Asking for local youth skill-development center updates.',
    auditStatus: 'Pending',
    collectorEmail: 'rohan.field@matdatapulse.in',
  },
  {
    voterFullName: 'Sunita Patwardhan',
    age: 61,
    gender: 'Female',
    mobileNumber: '9765011998',
    assemblyConstituency: 'Shivajinagar',
    wardNumber: 'Ward 11',
    priorityCivicIssue: 'Healthcare',
    sentimentRating: 'Positive',
    surveyorNotes: 'Happy with new municipal clinic OPD timings.',
    auditStatus: 'Verified',
    collectorEmail: 'rohan.field@matdatapulse.in',
  },
  {
    voterFullName: 'Amitabh Kulkarni',
    age: 28,
    gender: 'Male',
    mobileNumber: '9850112233',
    assemblyConstituency: 'Kothrud',
    wardNumber: 'Ward 08',
    priorityCivicIssue: 'Roads',
    sentimentRating: 'Negative',
    surveyorNotes: 'Heavy peak-hour bottleneck near Paud Phata junction.',
    auditStatus: 'Flagged',
    collectorEmail: 'sneha.field@matdatapulse.in',
  },
  {
    voterFullName: 'Meera Gokhale',
    age: 49,
    gender: 'Female',
    mobileNumber: '9922033445',
    assemblyConstituency: 'Kothrud',
    wardNumber: 'Ward 08',
    priorityCivicIssue: 'Water',
    sentimentRating: 'Positive',
    surveyorNotes: '24x7 metering project progressing smoothly in lane 2.',
    auditStatus: 'Verified',
    collectorEmail: 'sneha.field@matdatapulse.in',
  },
  {
    voterFullName: 'Sandeep Chavan',
    age: 38,
    gender: 'Male',
    mobileNumber: '9881099887',
    assemblyConstituency: 'Kothrud',
    wardNumber: 'Ward 09',
    priorityCivicIssue: 'Electricity',
    sentimentRating: 'Neutral',
    surveyorNotes: 'Occasional voltage fluctuations reported after rain.',
    auditStatus: 'Pending',
    collectorEmail: 'sneha.field@matdatapulse.in',
  },
  {
    voterFullName: 'Kavita Sawant',
    age: 31,
    gender: 'Female',
    mobileNumber: '9766123400',
    assemblyConstituency: 'Kasba Peth',
    wardNumber: 'Ward 22',
    priorityCivicIssue: 'Water',
    sentimentRating: 'Negative',
    surveyorNotes: 'Requested evening tanker schedule alignment for old wada.',
    auditStatus: 'Verified',
    collectorEmail: 'rohan.field@matdatapulse.in',
  },
  {
    voterFullName: 'Vikramaditya More',
    age: 45,
    gender: 'Male',
    mobileNumber: '9822556677',
    assemblyConstituency: 'Kasba Peth',
    wardNumber: 'Ward 21',
    priorityCivicIssue: 'Employment',
    sentimentRating: 'Positive',
    surveyorNotes: 'Small business MSME credit camp was well attended.',
    auditStatus: 'Verified',
    collectorEmail: 'sneha.field@matdatapulse.in',
  },
  {
    voterFullName: 'Ananya Shinde',
    age: 24,
    gender: 'Female',
    mobileNumber: '9890778899',
    assemblyConstituency: 'Parvati',
    wardNumber: 'Ward 30',
    priorityCivicIssue: 'Healthcare',
    sentimentRating: 'Positive',
    surveyorNotes: 'Strong positive feedback on maternal health outreach drive.',
    auditStatus: 'Pending',
    collectorEmail: 'sneha.field@matdatapulse.in',
  },
] as const;

export async function seedDatabase(): Promise<void> {
  await runMigrations();

  await withTransaction(async (client) => {
    const userIdByEmail = new Map<string, string>();

    for (const user of SEED_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      const res = await client.query<{ id: string }>(
        `INSERT INTO users (full_name, email, password_hash, role, assigned_constituency)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               role = EXCLUDED.role,
               assigned_constituency = EXCLUDED.assigned_constituency,
               updated_at = NOW()
         RETURNING id`,
        [user.fullName, user.email, passwordHash, user.role, user.assignedConstituency]
      );
      userIdByEmail.set(user.email, res.rows[0].id);
    }

    const adminId = userIdByEmail.get('director@matdatapulse.in') ?? null;

    for (let i = 0; i < SAMPLE_SURVEYS.length; i++) {
      const s = SAMPLE_SURVEYS[i];
      const collectorId = userIdByEmail.get(s.collectorEmail)!;
      const hash = crypto
        .createHash('md5')
        .update(`seed-survey-${i}-${s.mobileNumber}`)
        .digest('hex');
      const deterministicClientId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;

      const collectedAt = new Date(Date.now() - (SAMPLE_SURVEYS.length - i) * 3_600_000 * 4);

      await client.query(
        `INSERT INTO surveys (
           client_survey_id, collector_id, voter_full_name, age, gender,
           mobile_number, state, city, assembly_constituency, ward_number, priority_civic_issue,
           sentiment_rating, surveyor_notes, audit_status, reviewed_by, reviewed_at, collected_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (collector_id, client_survey_id) DO NOTHING`,
        [
          deterministicClientId,
          collectorId,
          s.voterFullName,
          s.age,
          s.gender,
          s.mobileNumber,
          'Maharashtra',
          'Pune',
          s.assemblyConstituency,
          s.wardNumber,
          s.priorityCivicIssue,
          s.sentimentRating,
          s.surveyorNotes,
          s.auditStatus,
          s.auditStatus === 'Pending' ? null : adminId,
          s.auditStatus === 'Pending' ? null : collectedAt,
          collectedAt,
        ]
      );
    }
  });

  logger.info('Database seeded successfully');
}

if (require.main === module) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      logger.error('Seed failed', { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    });
}
