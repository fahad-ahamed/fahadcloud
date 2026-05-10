// ============ MASTER CONTROLLER - AI Agent Orchestrator ============
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogger } from '@/lib/audit-logger';
import { persistentMemory } from '@/lib/agent/memory';
import { queueManager, QUEUES } from '@/lib/queue';
import { v4 as uuidv4 } from 'uuid';
import { aiChat } from '@/lib/agent/ai-engine';

// Get orchestrator status and task distribution
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';

    if (type === 'agents') {
      // Get all registered agents with their stats
      const agents = await db.agentRegistry.findMany().catch(() => []);
      return NextResponse.json({ agents });
    }

    if (type === 'tasks') {
      const tasks = await db.agentTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { logs: { take: 5, orderBy: { createdAt: 'desc' } } },
      });
      return NextResponse.json({ tasks });
    }

    // Default: overall orchestrator status
    const [totalTasks, runningTasks, completedTasks, failedTasks, agents, queueStatus] = await Promise.all([
      db.agentTask.count().catch(() => 0),
      db.agentTask.count({ where: { status: 'running' } }).catch(() => 0),
      db.agentTask.count({ where: { status: 'completed' } }).catch(() => 0),
      db.agentTask.count({ where: { status: 'failed' } }).catch(() => 0),
      db.agentRegistry.findMany().catch(() => []),
      queueManager.getAllQueuesStatus().catch(() => ({})),
    ]);

    return NextResponse.json({
      orchestrator: { status: 'active', totalTasks, runningTasks, completedTasks, failedTasks },
      agents: agents.length || 12,
      queues: queueStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit a task to the orchestrator for distribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskType, description, input, priority = 'medium', agentType } = body;

    if (!userId || !taskType || !description) {
      return NextResponse.json({ error: 'userId, taskType, and description are required' }, { status: 400 });
    }

    // Determine which agent should handle this task
    const assignedAgent = agentType || await routeTask(taskType, description);

    // Create task
    const task = await db.agentTask.create({
      data: {
        userId,
        type: taskType,
        description,
        status: 'planned',
        priority,
        plan: JSON.stringify({ agentType: assignedAgent, input }),
        sessionId: body.sessionId || (await db.agentSession.create({
          data: { userId, title: description.substring(0, 100), agentType: assignedAgent }
        })).id,
      },
    });

    // Add to queue for processing
    await queueManager.addJob(QUEUES.AI_TASK, `task:${task.id}`, {
      taskId: task.id,
      userId,
      agentType: assignedAgent,
      action: taskType,
      input: input || {},
      priority,
    }, { priority: priority === 'critical' ? 1 : priority === 'high' ? 2 : priority === 'medium' ? 5 : 8 });

    // Process the task
    processTaskAsync(task.id, userId, assignedAgent, taskType, input, description);

    await auditLogger.logAgentAction(userId, assignedAgent, 'task_submitted', { taskId: task.id, taskType });

    return NextResponse.json({
      taskId: task.id,
      agentType: assignedAgent,
      status: 'planned',
      message: `Task assigned to ${assignedAgent} agent and queued for processing.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Route a task to the appropriate agent
async function routeTask(taskType: string, description: string): Promise<string> {
  const routing: Record<string, string> = {
    code_review: 'coding',
    code_write: 'coding',
    code_refactor: 'coding',
    code_debug: 'debug',
    vulnerability_scan: 'security',
    security_audit: 'security',
    ui_design: 'ui',
    ui_implement: 'ui',
    deploy: 'devops',
    infrastructure: 'devops',
    research: 'research',
    learn: 'learning',
    bug_scan: 'bug_detector',
    bug_fix: 'auto_fix',
    self_improve: 'self_improvement',
    memory_store: 'memory',
    memory_search: 'memory',
  };

  return routing[taskType] || 'master_controller';
}

// Process task asynchronously
async function processTaskAsync(
  taskId: string, userId: string, agentType: string, 
  taskType: string, input: any, description: string
) {
  (async () => {
    try {
      await db.agentTask.update({ where: { id: taskId }, data: { status: 'running', startedAt: new Date() } });

      // Update agent status
      const agent = await db.agentRegistry.findFirst({ where: { agentId: agentType } });
      if (agent) {
        await db.agentRegistry.update({
          where: { id: agent.id },
          data: { status: 'busy', totalTasks: agent.totalTasks + 1, lastActiveAt: new Date() },
        });
      }

      // Using aiChat from engine instead of direct ZAI

      // Build system prompt based on agent type
      const systemPrompts: Record<string, string> = {
        coding: 'You are an expert coding agent. Write, review, and refactor code with best practices.',
        security: 'You are a security agent. Detect vulnerabilities and recommend fixes.',
        debug: 'You are a debug agent. Find root causes of issues and suggest fixes.',
        ui: 'You are a UI agent. Design and implement user interfaces with modern best practices.',
        devops: 'You are a DevOps agent. Manage deployments, CI/CD, and infrastructure.',
        research: 'You are a research agent. Find and synthesize information from multiple sources.',
        learning: 'You are a learning agent. Research topics and build knowledge bases.',
        bug_detector: 'You are a bug detection agent. Identify bugs, code smells, and potential issues.',
        auto_fix: 'You are an auto-fix agent. Generate patches and fixes for detected bugs.',
        self_improvement: 'You are a self-improvement agent. Analyze past performance and suggest improvements.',
        memory: 'You are a memory agent. Store, retrieve, and manage AI memory and knowledge.',
        master_controller: 'You are the master controller. Coordinate between agents and manage task distribution.',
      };

      const { aiChat } = await import('@/lib/agent/ai-engine');
      const aiResult = await aiChat([
        { role: 'system', content: systemPrompts[agentType] || systemPrompts.master_controller },
        { role: 'user', content: `Task: ${description}\nInput: ${JSON.stringify(input || {}).substring(0, 1000)}\n\nComplete this task and provide the result.` },
      ], { temperature: 0.3, maxTokens: 2000 });

      const result = aiResult.message || '';

      // Store result in memory
      await persistentMemory.store(
        userId, 'workflow', agentType, `task:${taskId}`,
        { taskType, description, result: result.substring(0, 2000) },
        agentType, [taskType, agentType]
      );

      await db.agentTask.update({
        where: { id: taskId },
        data: { status: 'completed', result, completedAt: new Date() },
      });

      // Update agent stats
      if (agent) {
        await db.agentRegistry.update({
          where: { id: agent.id },
          data: { status: 'idle', completedTasks: agent.completedTasks + 1, lastActiveAt: new Date() },
        });
      }

      await auditLogger.logAgentAction(userId, agentType, 'task_completed', { taskId, taskType });
    } catch (error: any) {
      await db.agentTask.update({
        where: { id: taskId },
        data: { status: 'failed', error: error.message, completedAt: new Date() },
      }).catch(() => {});

      // Update agent stats
      const agent = await db.agentRegistry.findFirst({ where: { agentId: agentType } }).catch(() => null);
      if (agent) {
        await db.agentRegistry.update({
          where: { id: agent.id },
          data: { status: 'idle', failedTasks: agent.failedTasks + 1 },
        }).catch(() => {});
      }
    }
  })();
}
