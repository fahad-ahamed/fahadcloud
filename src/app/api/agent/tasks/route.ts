import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeApprovedTask, oneClickDeploy } from '@/lib/agent/core';

const prisma = new PrismaClient();

// GET /api/agent/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const tasks = await prisma.agentTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { logs: { orderBy: { step: 'asc' } } },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/tasks - Create/approve task
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const body = await request.json();
    const { action, taskId, deployConfig } = body;

    if (action === 'approve' && taskId) {
      const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
      if (!task || (task.userId !== userId && payload.role !== 'admin')) {
        return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
      }
      const result = await executeApprovedTask(taskId, userId);
      return NextResponse.json(result);
    }

    if (action === 'cancel' && taskId) {
      await prisma.agentTask.update({
        where: { id: taskId },
        data: { status: 'cancelled' },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'one_click_deploy' && deployConfig) {
      const { domainName, framework, sessionId } = deployConfig;
      if (!domainName || !framework) {
        return NextResponse.json({ error: 'domainName and framework are required' }, { status: 400 });
      }
      const result = await oneClickDeploy(userId, domainName, framework, sessionId || 'quick_deploy');
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


