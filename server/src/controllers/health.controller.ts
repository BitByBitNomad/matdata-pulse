import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { redisManager } from '../config/redis';

export async function healthController(_req: Request, res: Response): Promise<void> {
  const [postgresOk, redisOk] = await Promise.all([
    checkDatabaseHealth(),
    redisManager.ping(),
  ]);

  const statusCode = postgresOk ? 200 : 503;
  res.status(statusCode).json({
    success: postgresOk,
    service: 'matdata-pulse-api',
    timestamp: new Date().toISOString(),
    dependencies: {
      postgres: postgresOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'degraded',
    },
  });
}
