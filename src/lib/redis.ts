// ============ REDIS CLIENT - Cache + Realtime + Sessions + Queues ============
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Main Redis client for general use
const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis = globalForRedis.redis ?? new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  lazyConnect: true,
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// ============ SCAN-BASED KEY RETRIEVAL (safe for production) ============
async function scanKeys(pattern: string, count: number = 100): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

async function scanDel(pattern: string): Promise<number> {
  let deleted = 0;
  let cursor = '0';
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (batch.length > 0) {
      await redis.del(...batch);
      deleted += batch.length;
    }
  } while (cursor !== '0');
  return deleted;
}

// ============ CACHE LAYER ============
export class CacheLayer {
  private prefix = 'fc:cache:';

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(this.prefix + key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    await redis.setex(this.prefix + key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await redis.del(this.prefix + key);
  }

  async deletePattern(pattern: string): Promise<void> {
    await scanDel(this.prefix + pattern);
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

export const cache = new CacheLayer();

// ============ SESSION MANAGER ============
export class SessionManager {
  private prefix = 'fc:session:';

  async create(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    await redis.setex(this.prefix + sessionId, ttlSeconds, JSON.stringify(data));
  }

  async get(sessionId: string): Promise<any | null> {
    const data = await redis.get(this.prefix + sessionId);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async update(sessionId: string, data: any): Promise<void> {
    const existing = await this.get(sessionId);
    const updated = { ...existing, ...data };
    const ttl = await redis.ttl(this.prefix + sessionId);
    if (ttl > 0) {
      await redis.setex(this.prefix + sessionId, ttl, JSON.stringify(updated));
    } else {
      await redis.setex(this.prefix + sessionId, 86400, JSON.stringify(updated));
    }
  }

  async destroy(sessionId: string): Promise<void> {
    await redis.del(this.prefix + sessionId);
  }

  async refresh(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
    await redis.expire(this.prefix + sessionId, ttlSeconds);
  }
}

export const sessionManager = new SessionManager();

// ============ OTP MANAGER ============
export class OTPManager {
  private prefix = 'fc:otp:';

  async store(identifier: string, otp: string, ttlSeconds: number = 300): Promise<void> {
    await redis.setex(this.prefix + identifier, ttlSeconds, otp);
    // Track attempts
    await redis.setex(this.prefix + identifier + ':attempts', ttlSeconds, '0');
  }

  async verify(identifier: string, otp: string): Promise<{ valid: boolean; attemptsLeft: number }> {
    const stored = await redis.get(this.prefix + identifier);
    if (!stored) return { valid: false, attemptsLeft: 0 };

    const attemptsStr = await redis.get(this.prefix + identifier + ':attempts') || '0';
    const attempts = parseInt(attemptsStr, 10);

    if (attempts >= 5) {
      await redis.del(this.prefix + identifier, this.prefix + identifier + ':attempts');
      return { valid: false, attemptsLeft: 0 };
    }

    if (stored === otp) {
      await redis.del(this.prefix + identifier, this.prefix + identifier + ':attempts');
      return { valid: true, attemptsLeft: 5 - attempts - 1 };
    }

    await redis.incr(this.prefix + identifier + ':attempts');
    return { valid: false, attemptsLeft: 5 - attempts - 1 };
  }
}

export const otpManager = new OTPManager();

// ============ AI TEMPORARY MEMORY ============
export class AITempMemory {
  private prefix = 'fc:ai:temp:';

  async store(userId: string, key: string, value: any, ttlSeconds: number = 1800): Promise<void> {
    await redis.setex(this.prefix + userId + ':' + key, ttlSeconds, JSON.stringify(value));
  }

  async get(userId: string, key: string): Promise<any | null> {
    const data = await redis.get(this.prefix + userId + ':' + key);
    if (!data) return null;
    try { return JSON.parse(data); } catch { return null; }
  }

  async getAll(userId: string): Promise<Record<string, any>> {
    const keys = await scanKeys(this.prefix + userId + ':*');
    const result: Record<string, any> = {};
    for (const k of keys) {
      const data = await redis.get(k);
      const shortKey = k.replace(this.prefix + userId + ':', '');
      try { result[shortKey] = JSON.parse(data!); } catch { result[shortKey] = data; }
    }
    return result;
  }

  async clear(userId: string): Promise<void> {
    await scanDel(this.prefix + userId + ':*');
  }
}

export const aiTempMemory = new AITempMemory();

// ============ REALTIME PUB/SUB ============
export class RealtimeBus {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.publisher = new Redis(REDIS_URL, { lazyConnect: true });
    this.subscriber = new Redis(REDIS_URL, { lazyConnect: true });
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish('fc:rt:' + channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe('fc:rt:' + channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === 'fc:rt:' + channel) {
        try { callback(JSON.parse(msg)); } catch { callback(msg); }
      }
    });
  }
}

export const realtimeBus = new RealtimeBus();

// ============ RATE LIMITER (Redis-based) ============
export class RedisRateLimiter {
  private prefix = 'fc:rl:';

  async check(identifier: string, action: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = this.prefix + identifier + ':' + action;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use Redis sorted set for sliding window
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, now + ':' + Math.random().toString(36).slice(2));
    multi.zcard(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();

    const count = results?.[2]?.[1] as number || 0;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return { allowed, remaining, resetAt: (now + windowSeconds) * 1000 };
  }
}

export const redisRateLimiter = new RedisRateLimiter();

// ============ HEALTH CHECK ============
export async function checkRedisHealth(): Promise<{ status: string; info: any }> {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(\S+)/)?.[1] || 'unknown';
    return { status: 'healthy', info: { latency: latency + 'ms', usedMemory, connected: true } };
  } catch (error: any) {
    return { status: 'unhealthy', info: { error: error.message, connected: false } };
  }
}
