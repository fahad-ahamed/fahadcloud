import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/agent/history - Get agent activity history
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    let result: any = {};

    if (type === 'all' || type === 'tasks') {
      result.tasks = await prisma.agentTask.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { logs: true },
      });
    }

    if (type === 'all' || type === 'executions') {
      result.executions = await prisma.agentToolExecution.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    if (type === 'all' || type === 'sessions') {
      result.sessions = await prisma.agentSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: { _count: { select: { messages: true, tasks: true } } },
      });
    }

    if (type === 'all' || type === 'deployments') {
      result.deployments = await prisma.deploymentLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
