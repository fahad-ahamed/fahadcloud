import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSystemInfo } from '@/lib/sysutils';
import { getMonitoringEngine } from '@/lib/monitoring-engine';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;

    // Get real-time system metrics from MonitoringEngine
    const monitoringEngine = getMonitoringEngine();
    const metrics = monitoringEngine.collectMetrics();
    const alerts = monitoringEngine.checkAlerts(metrics);

    // Get historical data
    const cpuHistory = await monitoringEngine.getHistoricalMetrics('cpu', 24);
    const ramHistory = await monitoringEngine.getHistoricalMetrics('ram', 24);
    const diskHistory = await monitoringEngine.getHistoricalMetrics('disk', 24);

    const systemHealth = getSystemInfo();
    const hostingEnvs = await prisma.hostingEnvironment.findMany({
      where: { userId },
      include: { domain: true },
    });
    const recentDeploys = await prisma.deploymentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const activeTasks = await prisma.agentTask.findMany({
      where: { userId, status: { in: ['running', 'planned', 'approved'] } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      system: systemHealth,
      metrics,
      alerts,
      historicalData: {
        cpu: cpuHistory,
        ram: ramHistory,
        disk: diskHistory,
      },
      hostingEnvs,
      recentDeploys,
      activeTasks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
