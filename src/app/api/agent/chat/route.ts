import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '@/lib/agent/orchestrator';
import { classifyIntent } from '@/lib/agent/core';
import { getAutoLearningEngine } from '@/lib/agent/auto-learning';

const prisma = new PrismaClient();

// POST /api/agent/chat - Main AI chat endpoint with multi-agent orchestration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await ActivityLog.aiChat(userId, body.message || '', request);
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
    }

    // Get user from cookie
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT
    let userId: string;
    try {
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get or create session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const session = await prisma.agentSession.create({
        data: { userId, title: message.substring(0, 50), context: JSON.stringify({}) },
      });
      activeSessionId = session.id;
    } else {
      const session = await prisma.agentSession.findUnique({ where: { id: activeSessionId } });
      if (!session || session.userId !== userId) {
        const session = await prisma.agentSession.create({
          data: { userId, title: message.substring(0, 50), context: JSON.stringify({}) },
        });
        activeSessionId = session.id;
      }
    }

    // Store user message
    await prisma.agentMessage.create({
      data: { sessionId: activeSessionId, role: 'user', content: message },
    });

    // Get conversation history
    const history = await prisma.agentMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    // Classify intent using the original classifier
    const intentResult = classifyIntent(message);

    // Enrich with Auto Learning context
    let learningContext = '';
    try {
      const autoLearning = getAutoLearningEngine();
      learningContext = await autoLearning.getContextForQuery(message) || '';
      // Run a learning cycle in background (non-blocking)
      autoLearning.runLearningCycle().catch(() => {});
    } catch {}

    // Process through the multi-agent orchestrator
    const orchestrator = getOrchestrator();
    const result = await orchestrator.processRequest(
      userId,
      activeSessionId,
      message,
      intentResult.intent,
      intentResult.entities,
      history.map(h => ({ role: h.role, content: h.content })),
    );

    // Store assistant message
    await prisma.agentMessage.create({
      data: {
        sessionId: activeSessionId,
        role: 'assistant',
        content: result.response,
        toolCalls: JSON.stringify(result.tasks || []),
        metadata: JSON.stringify({
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          thinking: result.thinking,
          activeAgents: result.activeAgents,
          orchestrationPlanId: result.orchestrationPlan?.id,
          reasoningChainId: result.reasoningChain?.id,
        }),
      },
    });

    // Store workflow memory
    try {
      await prisma.agentMemory.create({
        data: {
          userId,
          type: 'workflow',
          key: `chat_${Date.now()}`,
          value: JSON.stringify({
            intent: intentResult.intent,
            message: message.substring(0, 200),
            entities: intentResult.entities,
            activeAgents: result.activeAgents,
          }),
          relevance: 1.0,
        },
      });
    } catch {}

    return NextResponse.json({
      message: result.response,
      thinking: result.thinking,
      actions: result.actions,
      tasks: result.tasks,
      suggestions: result.suggestions,
      status: result.status,
      sessionId: activeSessionId,
      activeAgents: result.activeAgents,
      orchestrationPlan: result.orchestrationPlan ? {
        id: result.orchestrationPlan.id,
        steps: result.orchestrationPlan.steps.map(s => ({
          id: s.id,
          order: s.order,
          agentId: s.agentId,
          action: s.action,
          description: s.description,
          status: s.status,
          riskLevel: s.riskLevel,
          requiresApproval: s.requiresApproval,
        })),
        riskLevel: result.orchestrationPlan.riskLevel,
        approvalRequired: result.orchestrationPlan.approvalRequired,
      } : null,
      reasoningChain: result.reasoningChain ? {
        id: result.reasoningChain.id,
        thoughts: result.reasoningChain.thoughts.map(t => ({
          step: t.step,
          type: t.type,
          content: t.content,
          confidence: t.confidence,
          agentId: t.agentId,
        })),
        conclusion: result.reasoningChain.conclusion,
        confidence: result.reasoningChain.confidence,
      } : null,
    });
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET /api/agent/chat - Get chat history
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
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const messages = await prisma.agentMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      return NextResponse.json({ messages });
    }

    const sessions = await prisma.agentSession.findMany({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

