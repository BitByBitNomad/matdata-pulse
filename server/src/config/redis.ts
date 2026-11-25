import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

class RedisManager {
  private client: Redis | null = null;
  private isConnected = false;

  public getClient(): Redis | null {
    if (this.client || env.NODE_ENV === 'test') {
      return this.client;
    }

    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 250, 5_000),
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis connection ready');
    });

    this.client.on('error', (err) => {
      if (this.isConnected) {
        logger.warn('Redis connection error', { error: err.message });
      }
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    this.client.connect().catch((err) => {
      logger.warn('Redis initial connection failed, falling back gracefully', {
        error: err.message,
      });
    });

    return this.client;
  }

  public isReady(): boolean {
    return Boolean(this.client && this.isConnected && this.client.status === 'ready');
  }

  public async ping(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client || client.status !== 'ready') return false;
      const res = await client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  public async getJson<T>(key: string): Promise<T | null> {
    try {
      if (!this.isReady() || !this.client) return null;
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  public async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      if (!this.isReady() || !this.client) return;
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Non-fatal cache write failure
    }
  }

  public async deleteByPattern(pattern: string): Promise<void> {
    try {
      if (!this.isReady() || !this.client) return;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Non-fatal cache invalidation failure
    }
  }

  public async revokeTokenJti(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    try {
      if (!this.isReady() || !this.client) return;
      await this.client.set(`revoked:jti:${jti}`, '1', 'EX', ttlSeconds);
    } catch {
      // Fallback handled if Redis unavailable
    }
  }

  public async isTokenJtiRevoked(jti: string): Promise<boolean> {
    try {
      if (!this.isReady() || !this.client) return false;
      const exists = await this.client.exists(`revoked:jti:${jti}`);
      return exists === 1;
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redisManager = new RedisManager();
