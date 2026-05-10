// ============ AGENT MONITOR DASHBOARD API ============
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, authErrorResponse } from '@/lib/middleware/auth.middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    // Get all registered agents
    const agents = await prisma.agentRegistry.findMany({
      orderBy: { lastActiveAt: 'desc' },
    });

    // Get recent activity logs
    const recentLogs = await prisma.agentActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate stats
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'busy').length;
    const totalCompleted = agents.reduce((sum, a) => sum + a.completedTasks, 0);
    const totalFailed = agents.reduce((sum, a) => sum + a.failedTasks, 0);

    // If no agents registered yet, provide default 14 agent definitions
    let agentList = agents;
    if (agents.length === 0) {
      const defaultAgents = [
        { agentId: 'devops', name: 'DevOps Agent', type: 'devops', status: 'idle' },
        { agentId: 'security', name: 'Security Agent', type: 'security', status: 'idle' },
        { agentId: 'deployment', name: 'Deployment Agent', type: 'deployment', status: 'idle' },
        { agentId: 'monitoring', name: 'Monitoring Agent', type: 'monitoring', status: 'idle' },
        { agentId: 'debugging', name: 'Debug Agent', type: 'debugging', status: 'idle' },
        { agentId: 'infrastructure', name: 'Infrastructure Agent', type: 'infrastructure', status: 'idle' },
        { agentId: 'database', name: 'Database Agent', type: 'database', status: 'idle' },
        { agentId: 'optimization', name: 'Optimization Agent', type: 'optimization', status: 'idle' },
        { agentId: 'recovery', name: 'Recovery Agent', type: 'recovery', status: 'idle' },
        { agentId: 'scaling', name: 'Scaling Agent', type: 'scaling', status: 'idle' },
        { agentId: 'dns_domain', name: 'DNS Agent', type: 'dns_domain', status: 'idle' },
        { agentId: 'payment', name: 'Payment Agent', type: 'payment', status: 'idle' },
        { agentId: 'supervisor', name: 'Supervisor Agent', type: 'supervisor', status: 'idle' },
        { agentId: 'auto_learning', name: 'Auto-Learning Agent', type: 'auto_learning', status: 'idle' },
      ];
      agentList = defaultAgents.map(a => ({
        ...a,
        id: a.agentId,
        description: `${a.name} for FahadCloud`,
        capabilities: '[]',
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        avgResponseTime: 0,
        lastActiveAt: new Date(),
        config: '{}',
        version: '3.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    return NextResponse.json({
      agents: agentList,
      recentLogs,
      stats: {
        totalAgents,
        activeAgents,
        completedTasks: totalCompleted,
        failedTasks: totalFailed,
      },
    });
  } catch (error: any) {
    console.error('Agent monitor error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
