interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  login: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  payment_submit: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  domain_search: { maxRequests: 30, windowMs: 60 * 1000 },
  payment_verify: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  admin_action: { maxRequests: 100, windowMs: 60 * 60 * 1000 },
  api_general: { maxRequests: 60, windowMs: 60 * 1000 },
  file_upload: { maxRequests: 20, windowMs: 60 * 1000 },
};

export function checkRateLimit(key: string, action: string): { allowed: boolean; remaining: number; resetIn: number } {
  const limit = LIMITS[action] || LIMITS.api_general;
  const now = Date.now();
  const storeKey = `${action}:${key}`;

  const entry = rateLimitStore.get(storeKey);

  if (!entry || (now - entry.windowStart) > limit.windowMs) {
    rateLimitStore.set(storeKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit.maxRequests - 1, resetIn: limit.windowMs };
  }

  if (entry.count >= limit.maxRequests) {
    const resetIn = limit.windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  return { allowed: true, remaining: limit.maxRequests - entry.count, resetIn: limit.windowMs - (now - entry.windowStart) };
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      const limit = LIMITS[key.split(':')[0]] || LIMITS.api_general;
      if ((now - entry.windowStart) > limit.windowMs * 2) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}
