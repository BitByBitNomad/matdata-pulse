import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export async function runMigrations(): Promise<void> {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  logger.info('PostgreSQL schema migration applied successfully');
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      logger.error('Migration failed', { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    });
}
