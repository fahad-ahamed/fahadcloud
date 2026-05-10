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

const rateStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetIn: number } {
  const limit = RATE_LIMITS[path] || RATE_LIMITS["default"];
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

// Periodic cleanup
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateStore.entries()) {
      if (now > entry.resetTime) rateStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function middleware(request: NextRequest) {
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
  const blockedPaths = ["/.env", "/.git", "/wp-admin", "/phpmyadmin", "/.htaccess", "/config.php"];
  if (blockedPaths.some(p => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  // API rate limiting
  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/health" || pathname === "/api/status") {
      return response;
    }

    const result = checkRateLimit(ip, pathname);
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetIn));

    if (!result.allowed) {
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

