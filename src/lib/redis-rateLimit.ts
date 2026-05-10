import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });
  }
  return redis;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  blockDuration?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 120,
  windowSeconds: 60,
  blockDuration: 300,
};

const CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 20, windowSeconds: 900, blockDuration: 1800 },
  register: { maxRequests: 10, windowSeconds: 3600, blockDuration: 3600 },
  admin_login: { maxRequests: 10, windowSeconds: 900, blockDuration: 1800 },
  password_reset: { maxRequests: 5, windowSeconds: 900, blockDuration: 1800 },
  payment_create: { maxRequests: 5, windowSeconds: 3600 },
  file_upload: { maxRequests: 20, windowSeconds: 60 },
  agent_chat: { maxRequests: 60, windowSeconds: 60 },
  shell_execute: { maxRequests: 30, windowSeconds: 60 },
  api_general: { maxRequests: 120, windowSeconds: 60 },
  domain_search: { maxRequests: 60, windowSeconds: 60 },
};

export async function redisRateLimit(
  identifier: string,
  action: string = "api_general",
  customConfig?: Partial<RateLimitConfig>
): Promise<{ allowed: boolean; remaining: number; resetIn: number; limit: number }> {
  try {
    const client = getRedis();
    const config = { ...CONFIGS[action] || DEFAULT_CONFIG, ...customConfig };
    const key = "ratelimit:" + action + ":" + identifier;
    const blockKey = "ratelimit:blocked:" + action + ":" + identifier;

    const isBlocked = await client.get(blockKey);
    if (isBlocked) {
      const ttl = await client.ttl(blockKey);
      return { allowed: false, remaining: 0, resetIn: ttl, limit: config.maxRequests };
    }

    const current = await client.incr(key);
    
    if (current === 1) {
      await client.expire(key, config.windowSeconds);
    }

    const ttl = await client.ttl(key);

    if (current > config.maxRequests) {
      const blockDuration = config.blockDuration || config.windowSeconds;
      await client.set(blockKey, "1", "EX", blockDuration);
      await client.del(key);
      return { allowed: false, remaining: 0, resetIn: blockDuration, limit: config.maxRequests };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - current),
      resetIn: ttl,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error("Rate limit error (failing open):", error);
    return { allowed: true, remaining: 999, resetIn: 0, limit: 999 };
  }
}

export async function resetRateLimit(identifier: string, action: string): Promise<void> {
  try {
    const client = getRedis();
    await client.del("ratelimit:" + action + ":" + identifier);
    await client.del("ratelimit:blocked:" + action + ":" + identifier);
  } catch {}
}
