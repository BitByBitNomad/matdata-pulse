import { pool } from './config/database';
import { env } from './config/env';
import { redisManager } from './config/redis';
import { createApp } from './app';
import { logger } from './utils/logger';

const app = createApp();

// Initialize Redis connection (non-blocking if Redis starts slightly later)
redisManager.getClient();

const server = app.listen(env.PORT, () => {
  logger.info(`Matdata Pulse API listening on port ${env.PORT}`, {
    env: env.NODE_ENV,
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await Promise.all([pool.end(), redisManager.disconnect()]);
    logger.info('PostgreSQL and Redis connections closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
