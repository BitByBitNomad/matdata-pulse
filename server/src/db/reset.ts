import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { seedDatabase } from './seed';

/**
 * Drops all existing tables in the `public` schema (without destroying Supabase
 * schema-level grants or extensions), then applies `schema.sql` and seeds fresh data.
 */
async function resetDatabase(): Promise<void> {
  const existing = await pool.query<{ tablename: string }>(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'`
  );

  const tableNames = existing.rows.map((r) => r.tablename);
  logger.info('Existing tables found in public schema', { tables: tableNames });

  for (const table of tableNames) {
    const safeIdentifier = `"${table.replace(/"/g, '""')}"`;
    await pool.query(`DROP TABLE IF EXISTS public.${safeIdentifier} CASCADE`);
  }

  logger.info('Dropped old tables cleanly; applying Matdata Pulse schema and seed...');
  await seedDatabase();
}

resetDatabase()
  .then(() => pool.end())
  .catch((err) => {
    logger.error('Database reset failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  });
