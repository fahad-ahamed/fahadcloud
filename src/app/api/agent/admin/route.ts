import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAIAdminStats, emergencyShutdown } from '@/lib/agent/core';



// GET /api/agent/admin - Admin stats and controls
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const stats = await getAIAdminStats();
    
    // Get AI system config
    const configs = await db.agentSystemConfig.findMany();
    const securityPolicies = await db.agentSecurityPolicy.findMany({ where: { isActive: true } });

    // Get recent suspicious activities
    const suspiciousActivities = await db.agentToolExecution.findMany({
      where: { riskLevel: { in: ['high', 'critical'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      stats,
      configs: configs.reduce((acc: any, c) => ({ ...acc, [c.key]: JSON.parse(c.value) }), {}),
      securityPolicies,
      suspiciousActivities,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/admin - Admin actions
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'emergency_shutdown': {
        await emergencyShutdown();
        return NextResponse.json({ success: true, message: 'AI Agent system emergency shutdown completed. All running tasks cancelled.' });
      }
      case 'update_config': {
        const { key, value } = body;
        if (!key || value === undefined) {
          return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
        }
        await db.agentSystemConfig.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value), updatedBy: payload.userId },
          update: { value: JSON.stringify(value), updatedBy: payload.userId },
        });
        return NextResponse.json({ success: true });
      }
      case 'clear_memory': {
        const { userId: targetUserId } = body;
        if (targetUserId) {
          await db.agentMemory.deleteMany({ where: { userId: targetUserId } });
        } else {
          await db.agentMemory.deleteMany({});
        }
        return NextResponse.json({ success: true, message: 'AI memory cleared' });
      }
      case 'approve_task': {
        const { taskId } = body;
        if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });
        const task = await db.agentTask.findUnique({ where: { id: taskId } });
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        const { executeApprovedTask } = await import('@/lib/agent/core');
        const result = await executeApprovedTask(taskId, payload.userId);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
