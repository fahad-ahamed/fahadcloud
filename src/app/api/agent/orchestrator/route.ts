import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/agent/orchestrator';
import { AGENT_DEFINITIONS, AgentId } from '@/lib/agent/types';

// GET /api/agent/orchestrator - Get system overview, agent status, orchestration data
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const orchestrator = getOrchestrator();

    // Get system overview
    const overview = await orchestrator.getSystemOverview();

    // Get all agent definitions
    const agents = Object.entries(AGENT_DEFINITIONS).map(([id, def]) => ({
      id: id as AgentId,
      name: def.name,
      description: def.description,
      capabilities: def.capabilities,
      riskLevel: def.riskLevel,
      canAutoExecute: def.canAutoExecute,
      icon: def.icon,
      color: def.color,
      status: 'online',
    }));

    return NextResponse.json({
      overview,
      agents,
      totalAgents: agents.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/orchestrator - Execute orchestrator actions
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
    const { action } = body;

    const orchestrator = getOrchestrator();

    switch (action) {
      case 'self_healing_check': {
        const result = await orchestrator.runSelfHealingCheck(userId);
        return NextResponse.json(result);
      }
      case 'security_scan': {
        const result = await orchestrator.runSecurityScan(userId);
        return NextResponse.json(result);
      }
      case 'system_overview': {
        const result = await orchestrator.getSystemOverview();
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

