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

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const MAX_GENERAL_PAYLOAD = 10 * 1024 * 1024; // 10MB
const MAX_UPLOAD_PAYLOAD = 50 * 1024 * 1024; // 50MB

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

  // API route handling: CORS + rate limiting + request size
  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/health" || pathname === "/api/status") {
      return response;
    }

    // CORS headers for API routes
    const origin = request.headers.get("origin");
    if (origin) {
      // In production, only allow configured origins
      const allowOrigin = ALLOWED_ORIGINS.length > 0
        ? (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
        : origin; // Dev: reflect origin
      response.headers.set("Access-Control-Allow-Origin", allowOrigin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Request size limit for API routes
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

