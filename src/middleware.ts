import { NextRequest, NextResponse } from "next/server";

const RATE_LIMITS: Record<string, { max: number; window: number }> = {
  "/api/auth/login": { max: 10, window: 60 * 1000 },
  "/api/auth/register": { max: 5, window: 60 * 1000 },
  "/api/auth/admin-login": { max: 5, window: 60 * 1000 },
  "/api/auth/request-reset": { max: 5, window: 15 * 60 * 1000 },
  "/api/auth/resend-verification": { max: 3, window: 15 * 60 * 1000 },
  "/api/agent/chat": { max: 30, window: 60 * 1000 },
  "/api/agent/execute": { max: 15, window: 60 * 1000 },
  "/api/system/shell": { max: 10, window: 60 * 1000 },
  "/api/upload": { max: 10, window: 60 * 1000 },
  "/api/payments/create": { max: 5, window: 60 * 1000 },
  "default": { max: 100, window: 60 * 1000 },
};

// IP blocking configuration
const IP_BLOCK_THRESHOLD = 10; // Block after this many rate limit violations
const IP_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const IP_VIOLATION_WINDOW_MS = 5 * 60 * 1000; // Track violations over 5 minutes

// Fallback in-memory store for when Redis is unavailable
const rateStore = new Map<string, { count: number; resetTime: number }>();
const ipViolations = new Map<string, { count: number; resetTime: number }>();
const blockedIPs = new Map<string, { unblockAt: number }>();

// Redis client (lazy-initialized)
let redisClient: import('ioredis').Redis | null = null;
let redisAvailable: boolean | null = null;

async function getRedis(): Promise<import('ioredis').Redis | null> {
  if (redisAvailable === false) return null;
  if (redisClient) return redisClient;

  try {
    const Redis = (await import('ioredis')).default;
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry in middleware
      lazyConnect: true,
      connectTimeout: 2000,
    });
    await redisClient.ping();
    redisAvailable = true;
    return redisClient;
  } catch {
    redisAvailable = false;
    redisClient = null;
    return null;
  }
}

// Redis-based rate limit check (sliding window)
async function checkRedisRateLimit(
  ip: string,
  path: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number } | null> {
  const redis = await getRedis();
  if (!redis) return null; // Fall back to in-memory

  const limit = RATE_LIMITS[path] || RATE_LIMITS["default"]!;
  const key = `fc:rl:mw:${ip}:${path}`;
  const windowSeconds = Math.ceil(limit.window / 1000);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`);
    multi.zcard(key);
    multi.expire(key, windowSeconds + 1);
    const results = await multi.exec();

    const count = (results?.[2]?.[1] as number) || 0;
    const allowed = count <= limit.max;
    const remaining = Math.max(0, limit.max - count);
    const resetIn = limit.window;

    return { allowed, remaining, resetIn };
  } catch {
    // Redis error — fall back to in-memory
    return null;
  }
}

// Check if an IP is blocked (Redis first, then in-memory fallback)
async function isIPBlocked(ip: string): Promise<boolean> {
  // Check in-memory first (fast, no Redis call needed)
  const blocked = blockedIPs.get(ip);
  if (blocked) {
    if (Date.now() < blocked.unblockAt) return true;
    blockedIPs.delete(ip);
  }

  const redis = await getRedis();
  if (redis) {
    try {
      const blockedUntil = await redis.get(`fc:blocked:${ip}`);
      if (blockedUntil) {
        const unblockAt = parseInt(blockedUntil, 10);
        if (Date.now() < unblockAt) return true;
        // Expired block, clean up
        await redis.del(`fc:blocked:${ip}`);
      }
    } catch {
      // Redis error, fall through
    }
  }

  return false;
}

// Record a rate limit violation and auto-block repeat offenders
async function recordViolation(ip: string): Promise<void> {
  const now = Date.now();

  // In-memory tracking
  const entry = ipViolations.get(ip);
  if (!entry || now > entry.resetTime) {
    ipViolations.set(ip, { count: 1, resetTime: now + IP_VIOLATION_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count >= IP_BLOCK_THRESHOLD) {
      // Auto-block this IP
      const unblockAt = now + IP_BLOCK_DURATION_MS;
      blockedIPs.set(ip, { unblockAt });
      ipViolations.delete(ip);

      // Also set in Redis for multi-instance awareness
      const redis = await getRedis();
      if (redis) {
        try {
          await redis.set(`fc:blocked:${ip}`, String(unblockAt), 'PX', IP_BLOCK_DURATION_MS);
        } catch { /* best effort */ }
      }
      return;
    }
  }

  // Also record in Redis for multi-instance awareness
  const redis = await getRedis();
  if (redis) {
    try {
      const vKey = `fc:violations:${ip}`;
      const count = await redis.incr(vKey);
      if (count === 1) {
        await redis.expire(vKey, Math.ceil(IP_VIOLATION_WINDOW_MS / 1000));
      }
      if (count >= IP_BLOCK_THRESHOLD) {
        const unblockAt = now + IP_BLOCK_DURATION_MS;
        await redis.set(`fc:blocked:${ip}`, String(unblockAt), 'PX', IP_BLOCK_DURATION_MS);
        await redis.del(vKey);
      }
    } catch { /* best effort */ }
  }
}

// In-memory rate limit check (fallback)
function checkInMemoryRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetIn: number } {
  const limit = RATE_LIMITS[path] || RATE_LIMITS["default"]!;
  const key = ip + ":" + path;
  const now = Date.now();
  const entry = rateStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateStore.set(key, { count: 1, resetTime: now + limit.window });
    return { allowed: true, remaining: limit.max - 1, resetIn: limit.window };
  }

  if (entry.count >= limit.max) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: limit.max - entry.count, resetIn: entry.resetTime - now };
}

// Periodic cleanup of in-memory stores
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateStore.entries()) {
      if (now > entry.resetTime) rateStore.delete(key);
    }
    for (const [key, entry] of ipViolations.entries()) {
      if (now > entry.resetTime) ipViolations.delete(key);
    }
    for (const [key, entry] of blockedIPs.entries()) {
      if (now > entry.unblockAt) blockedIPs.delete(key);
    }
  }, 5 * 60 * 1000);
}

// CORS configuration — enforce strict origins in production
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const MAX_GENERAL_PAYLOAD = 10 * 1024 * 1024; // 10MB
const MAX_UPLOAD_PAYLOAD = 50 * 1024 * 1024; // 50MB
const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024; // 10MB — max body read at middleware level

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  const response = NextResponse.next();

  // Security: Remove server identification headers
  response.headers.delete("x-powered-by");

  // Add request ID for tracing
  response.headers.set("X-Request-ID", crypto.randomUUID());

  // Block common attack paths
  const blockedPaths = ["/.env", "/.git", "/wp-admin", "/phpmyadmin", "/.htaccess", "/config.php", "/wp-login.php", "/xmlrpc.php"];
  if (blockedPaths.some(p => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  // API route handling: CORS + rate limiting + request size + IP blocking
  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/health" || pathname === "/api/status") {
      return response;
    }

    // IP blocking check — check before any other processing
    const isBlocked = await isIPBlocked(ip);
    if (isBlocked) {
      return NextResponse.json(
        { error: "Access denied. Your IP has been temporarily blocked due to excessive requests." },
        { status: 403 }
      );
    }

    // CORS headers for API routes — strict origin checking
    const origin = request.headers.get("origin");
    if (origin) {
      let allowOrigin: string | null = null;

      if (ALLOWED_ORIGINS.length > 0) {
        // In production: only allow configured origins
        if (ALLOWED_ORIGINS.includes(origin)) {
          allowOrigin = origin;
        }
        // If origin not in allowed list, don't set CORS headers (blocks the request)
      } else if (process.env.NODE_ENV !== 'production') {
        // In development without configured origins: allow all
        allowOrigin = origin;
      }
      // In production without ALLOWED_ORIGINS: no CORS (same-origin only)

      if (allowOrigin) {
        response.headers.set("Access-Control-Allow-Origin", allowOrigin);
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Max-Age", "86400");
      }
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Request size limit for API routes (Content-Length header check)
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 0) {
      const isUploadRoute = pathname.startsWith("/api/upload") || pathname.includes("/upload");
      const maxAllowed = isUploadRoute ? MAX_UPLOAD_PAYLOAD : MAX_GENERAL_PAYLOAD;
      if (contentLength > maxAllowed) {
        return NextResponse.json(
          { error: `Request too large. Maximum size is ${isUploadRoute ? '50MB' : '10MB'}.` },
          { status: 413 }
        );
      }
    }

    // Request body size validation at middleware level
    // Clone the request body and validate its actual size for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      try {
        const cloned = request.clone();
        const reader = cloned.body?.getReader();
        if (reader) {
          let totalBytes = 0;
          let done = false;
          while (!done) {
            const result = await reader.read();
            done = result.done;
            if (result.value) {
              totalBytes += result.value.length;
              if (totalBytes > MAX_REQUEST_BODY_BYTES) {
                reader.cancel();
                return NextResponse.json(
                  { error: `Request body exceeds maximum allowed size of 10MB.` },
                  { status: 413 }
                );
              }
            }
          }
        }
      } catch {
        // Body read failed — let the route handler deal with it
      }
    }

    // Rate limiting: try Redis first, fall back to in-memory
    let result = await checkRedisRateLimit(ip, pathname);
    if (!result) {
      result = checkInMemoryRateLimit(ip, pathname);
    }

    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetIn));

    if (!result.allowed) {
      // Record the violation for IP blocking
      await recordViolation(ip);

      return NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter: Math.ceil(result.resetIn / 1000) },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          }
        }
      );
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
