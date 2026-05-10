import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  let allHealthy = true;

  // 1. Database check
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const start = Date.now();
    await prisma.user.count();
    checks.database = { status: "healthy", latency: (Date.now() - start) + "ms" };
    await prisma.$disconnect();
  } catch (e: any) {
    checks.database = { status: "unhealthy", error: e.message };
    allHealthy = false;
  }

  // 2. Redis check
  try {
    const Redis = (await import("ioredis")).default;
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    const start = Date.now();
    await redis.ping();
    const info = await redis.info("memory");
    const usedMatch = info.match(/used_memory_human:(.*)/);
    const dbSize = await redis.dbsize();
    checks.redis = { 
      status: "healthy", 
      latency: (Date.now() - start) + "ms",
      usedMemory: usedMatch ? usedMatch[1].trim() : "unknown",
      dbSize,
      connected: true
    };
    redis.disconnect();
  } catch (e: any) {
    checks.redis = { status: "unhealthy", error: e.message };
    allHealthy = false;
  }

  // 3. Qdrant check
  try {
    const start = Date.now();
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    const res = await fetch(qdrantUrl + "/collections");
    const data = await res.json();
    checks.qdrant = {
      status: "healthy",
      latency: (Date.now() - start) + "ms",
      collections: data.result ? Object.keys(data.result.collections || {}).length : 0
    };
  } catch (e: any) {
    checks.qdrant = { status: "unhealthy", error: e.message };
    allHealthy = false;
  }

  // 4. App server
  checks.server = {
    status: "healthy",
    version: "5.0.0-ultra",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development"
  };

  const totalLatency = Date.now() - startTime;

  return NextResponse.json({
    status: allHealthy ? "healthy" : "degraded",
    version: "5.0.0-ultra",
    timestamp: new Date().toISOString(),
    responseTime: totalLatency + "ms",
    checks,
    uptime: process.uptime()
  }, {
    status: allHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Check": "fahadcloud-ultra"
    }
  });
}
