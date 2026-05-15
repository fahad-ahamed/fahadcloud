import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { checkRedisHealth } from '@/lib/redis';

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  let allHealthy = true;

  // 1. Database check
  try {
    const start = Date.now();
    await db.user.count();
    checks.database = { status: "healthy", latency: (Date.now() - start) + "ms" };
  } catch (e: any) {
    checks.database = { status: "unhealthy", error: "Database connection failed" };
    allHealthy = false;
  }

  // 2. Redis check — reuse existing connection instead of creating new one
  try {
    const redisHealth = await checkRedisHealth();
    checks.redis = {
      status: redisHealth.status,
      latency: redisHealth.info?.latency || "unknown",
      usedMemory: redisHealth.info?.usedMemory || "unknown",
      connected: redisHealth.info?.connected || false,
    };
    if (redisHealth.status !== 'healthy') allHealthy = false;
  } catch (e: any) {
    checks.redis = { status: "unhealthy", error: "Redis connection failed" };
    allHealthy = false;
  }

  // 3. Qdrant check
  try {
    const start = Date.now();
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    const res = await fetch(qdrantUrl + "/collections", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    checks.qdrant = {
      status: "healthy",
      latency: (Date.now() - start) + "ms",
      collections: data.result ? Object.keys(data.result.collections || {}).length : 0
    };
  } catch (e: any) {
    checks.qdrant = { status: "unhealthy", error: "Qdrant connection failed" };
    allHealthy = false;
  }

  // 4. App server
  checks.server = {
    status: "healthy",
    version: "6.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development"
  };

  const totalLatency = Date.now() - startTime;

  return NextResponse.json({
    status: allHealthy ? "healthy" : "degraded",
    version: "6.0.0",
    timestamp: new Date().toISOString(),
    responseTime: totalLatency + "ms",
    checks,
    uptime: process.uptime()
  }, {
    status: allHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Check": "fahadcloud"
    }
  });
}
