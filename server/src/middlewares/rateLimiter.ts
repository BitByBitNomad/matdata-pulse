import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { redisManager } from '../config/redis';
import { AppError } from '../utils/appError';

interface RateLimitOptions {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

const REDIS_FIXED_WINDOW_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

function checkMemoryBucket(key: string, windowMs: number): { count: number; ttlMs: number } {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket: MemoryBucket = { count: 1, resetAt: now + windowMs };
    memoryBuckets.set(key, bucket);
    return { count: 1, ttlMs: windowMs };
  }
  existing.count += 1;
  return { count: existing.count, ttlMs: Math.max(0, existing.resetAt - now) };
}

/**
 * Distributed Redis-backed rate limiter using atomic Lua script with automatic
 * in-memory fallback when Redis is unavailable in local dev/test.
 */
export function createRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (env.NODE_ENV === 'test' && req.header('x-test-bypass-ratelimit') === '1') {
      next();
      return;
    }

    const identity = options.keyGenerator
      ? options.keyGenerator(req)
      : req.user?.id || req.ip || 'unknown';
    const key = `ratelimit:${options.keyPrefix}:${identity}`;

    let count = 1;
    let ttlMs = options.windowMs;

    const redisClient = redisManager.getClient();
    if (redisClient && redisManager.isReady()) {
      try {
        const result = (await redisClient.eval(
          REDIS_FIXED_WINDOW_LUA,
          1,
          key,
          String(options.windowMs)
        )) as [number, number];
        count = Number(result[0]);
        ttlMs = Math.max(0, Number(result[1]));
      } catch {
        const fallback = checkMemoryBucket(key, options.windowMs);
        count = fallback.count;
        ttlMs = fallback.ttlMs;
      }
    } else {
      const fallback = checkMemoryBucket(key, options.windowMs);
      count = fallback.count;
      ttlMs = fallback.ttlMs;
    }

    const remaining = Math.max(0, options.maxRequests - count);
    const resetEpochSeconds = Math.ceil((Date.now() + ttlMs) / 1000);

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetEpochSeconds));

    if (count > options.maxRequests) {
      res.setHeader('Retry-After', String(Math.ceil(ttlMs / 1000)));
      next(
        new AppError(
          'Too many requests. Please slow down and try again shortly.',
          429,
          'RATE_LIMIT_EXCEEDED',
          { retryAfterSeconds: Math.ceil(ttlMs / 1000) }
        )
      );
      return;
    }

    next();
  };
}

export const generalRateLimiter = createRateLimiter({
  keyPrefix: 'general',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
});

export const authRateLimiter = createRateLimiter({
  keyPrefix: 'auth',
  windowMs: 15 * 60_000,
  maxRequests: env.AUTH_RATE_LIMIT_MAX,
  keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.body?.email || '').toLowerCase()}`,
});

export const syncRateLimiter = createRateLimiter({
  keyPrefix: 'sync',
  windowMs: 60_000,
  maxRequests: env.SYNC_RATE_LIMIT_MAX,
});
