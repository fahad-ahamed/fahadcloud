import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { checkRedisHealth } from '@/lib/redis';
import { safeExec, safeShellExec } from '@/lib/shell-utils';
import { appConfig } from '@/lib/config/app.config';

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

  // 4. Disk space check
  try {
    const output = safeShellExec("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'", { timeout: 5000 });
    const parts = output.trim().split(/\s+/);
    const usagePercent = parseInt((parts[3] || '0').replace('%', '')) || 0;
    checks.diskSpace = {
      status: usagePercent >= 95 ? "critical" : usagePercent >= 85 ? "warning" : "healthy",
      total: parts[0] || "unknown",
      used: parts[1] || "unknown",
      available: parts[2] || "unknown",
      usagePercent,
    };
    if (usagePercent >= 95) allHealthy = false;
  } catch {
    checks.diskSpace = { status: "unknown", error: "Could not check disk space" };
  }

  // 5. Docker availability check
  try {
    const output = safeExec('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 5000 });
    const containerCount = safeExec('docker', ['ps', '-q'], { timeout: 5000 });
    checks.docker = {
      status: "healthy",
      serverVersion: output.trim(),
      runningContainers: containerCount.trim().split('\n').filter(Boolean).length,
    };
  } catch {
    checks.docker = { status: "unavailable", error: "Docker daemon not accessible" };
  }

  // 6. DNS server check
  try {
    const output = safeShellExec('sudo systemctl is-active dnsmasq 2>/dev/null || echo "inactive"', { timeout: 5000 });
    const isActive = output.trim() === 'active';
    checks.dnsServer = {
      status: isActive ? "healthy" : "degraded",
      server: "dnsmasq",
      active: isActive,
    };
    if (!isActive) allHealthy = false;
  } catch {
    checks.dnsServer = { status: "unavailable", error: "Could not check DNS server status" };
  }

  // 7. SSL certificate expiry check
  try {
    const sslDir = appConfig.hosting.sslDir;
    const output = safeShellExec(
      `find ${sslDir} -name "fullchain.pem" -maxdepth 2 -exec openssl x509 -in {} -noout -enddate -subject \\; 2>/dev/null | head -20`,
      { timeout: 10000 }
    );
    if (output.trim()) {
      const certs: { domain: string; expiresAt: string; daysLeft: number }[] = [];
      const lines = output.trim().split('\n');
      for (let i = 0; i < lines.length; i += 2) {
        const notAfterLine = lines[i] || '';
        const subjectLine = lines[i + 1] || '';
        const notAfter = notAfterLine.replace('notAfter=', '').trim();
        const domain = subjectLine.match(/CN\s*=\s*([^\/]+)/)?.[1]?.trim() || 'unknown';
        const expiresAt = new Date(notAfter);
        const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        certs.push({ domain, expiresAt: notAfter, daysLeft });
      }
      const hasExpiringCerts = certs.some(c => c.daysLeft <= 30);
      checks.sslCerts = {
        status: hasExpiringCerts ? "warning" : "healthy",
        certificates: certs,
        count: certs.length,
      };
    } else {
      checks.sslCerts = { status: "healthy", certificates: [], count: 0, note: "No SSL certificates found" };
    }
  } catch {
    checks.sslCerts = { status: "unknown", error: "Could not check SSL certificates" };
  }

  // 8. App server info
  checks.server = {
    status: "healthy",
    version: "7.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    serverIp: appConfig.serverIp,
  };

  const totalLatency = Date.now() - startTime;

  return NextResponse.json({
    status: allHealthy ? "healthy" : "degraded",
    version: "7.0.0",
    timestamp: new Date().toISOString(),
    responseTime: totalLatency + "ms",
    checks,
    uptime: process.uptime()
  }, {
    status: allHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Check": "fahadcloud",
      "X-Response-Time": totalLatency + "ms",
    }
  });
}
