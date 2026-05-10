import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getHostingEngine } from '@/lib/hosting-engine';

// GET /api/hosting/[id] - Get hosting environment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('fahadcloud-token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
        const payload = (await jwtVerify(token, secret)).payload;
        userId = payload.userId as string;
      } catch {}
    }
    if (!userId) {
      const currentUser = await getCurrentUser();
      if (currentUser) userId = currentUser.userId;
    }
    if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const env = await db.hostingEnvironment.findFirst({
      where: { id, userId },
      include: { domain: { select: { name: true, sslEnabled: true } } },
    });

    if (!env) return NextResponse.json({ error: 'Hosting environment not found' }, { status: 404 });

    // Get Docker container status if available
    let containerStatus = null;
    try {
      const engine = getHostingEngine();
      const containerName = `fc-${userId.substring(0, 8)}-${((env as any).domain?.name || 'default').replace(/\./g, '-')}`;
      containerStatus = engine.getContainerStatus(containerName);
    } catch {}

    return NextResponse.json({ ...env, containerStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/hosting/[id] - Execute actions on hosting environment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('fahadcloud-token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
        const payload = (await jwtVerify(token, secret)).payload;
        userId = payload.userId as string;
      } catch {}
    }
    if (!userId) {
      const currentUser = await getCurrentUser();
      if (currentUser) userId = currentUser.userId;
    }
    if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const env = await db.hostingEnvironment.findFirst({ where: { id, userId } });
    if (!env) return NextResponse.json({ error: 'Hosting environment not found' }, { status: 404 });

    const body = await request.json();
    const { action } = body;
    const engine = getHostingEngine();
    const containerName = `fc-${userId.substring(0, 8)}-${((env as any).domain?.name || 'default').replace(/\./g, '-')}`;

    switch (action) {
      case 'restart': {
        let restarted = false;
        try {
          if (engine.isDockerAvailable()) {
            await engine.stopContainer(containerName);
            restarted = await engine.startContainer(containerName);
          }
        } catch {}
        await db.hostingEnvironment.update({
          where: { id },
          data: { status: 'active', lastDeployedAt: new Date(), deployLog: `Restarted at ${new Date().toISOString()}` },
        });
        return NextResponse.json({ message: restarted ? 'Container restarted' : 'Environment restarted (simulated)', envId: id, containerRestarted: restarted });
      }
      case 'stop': {
        let stopped = false;
        try {
          if (engine.isDockerAvailable()) stopped = await engine.stopContainer(containerName);
        } catch {}
        await db.hostingEnvironment.update({
          where: { id },
          data: { status: 'stopped', deployLog: `Stopped at ${new Date().toISOString()}` },
        });
        return NextResponse.json({ message: stopped ? 'Container stopped' : 'Environment stopped', envId: id, containerStopped: stopped });
      }
      case 'start': {
        let started = false;
        try {
          if (engine.isDockerAvailable()) started = await engine.startContainer(containerName);
        } catch {}
        await db.hostingEnvironment.update({
          where: { id },
          data: { status: 'active', lastDeployedAt: new Date(), deployLog: `Started at ${new Date().toISOString()}` },
        });
        return NextResponse.json({ message: started ? 'Container started' : 'Environment started', envId: id, containerStarted: started });
      }
      case 'logs': {
        let logs = 'No container logs available';
        try {
          if (engine.isDockerAvailable()) logs = engine.getContainerLogs(containerName, 100);
        } catch {}
        return NextResponse.json({ logs, envId: id });
      }
      default:
        return NextResponse.json({ error: 'Unknown action. Use: restart, stop, start, logs' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
