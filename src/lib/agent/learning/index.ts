// ============ LEARNING & REASONING SYSTEM ============
// Reinforcement learning, predictive analysis, workflow evolution,
// autonomous optimization, and cross-project learning

import { PrismaClient } from '@prisma/client';
import { AgentId, LearningRecord, Prediction, generateId } from '../types';

const prisma = new PrismaClient();

// ============ LEARNING ENGINE ============

export class LearningEngine {
  private learningHistory: Map<string, LearningRecord[]> = new Map();
  private predictionModel: Map<string, { trend: number; confidence: number; lastUpdated: Date }> = new Map();

  // ============ RECORD LEARNING ============

  async recordLearning(
    agentId: AgentId,
    type: LearningRecord['type'],
    context: Record<string, any>,
    outcome: Record<string, any>,
    score: number
  ): Promise<void> {
    const record: LearningRecord = {
      id: generateId('learn'),
      agentId,
      type,
      context,
      outcome,
      score,
      timestamp: new Date(),
      appliedInProduction: false,
    };

    // Store in memory
    if (!this.learningHistory.has(agentId)) {
      this.learningHistory.set(agentId, []);
    }
    this.learningHistory.get(agentId)!.push(record);

    // Persist to database
    try {
      await prisma.agentMemory.create({
        data: {
          userId: 'system',
          type: 'agent_learning',
          key: `learning_${agentId}_${Date.now()}`,
          value: JSON.stringify({ type, context, outcome, score }),
          relevance: Math.abs(score),
        },
      });
    } catch {}
  }

  // ============ PREDICTIVE ANALYSIS ============

  async predictFailure(userId: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    try {
      const { getSystemInfo } = require('@/lib/sysutils');
      const sysInfo = getSystemInfo();

      // CPU trend prediction
      if (sysInfo.cpu > 70) {
        predictions.push({
          id: generateId('pred'),
          agentId: 'monitoring',
          type: 'performance_degradation',
          confidence: sysInfo.cpu > 85 ? 0.9 : 0.6,
          timeframe: sysInfo.cpu > 85 ? '1-2 hours' : '6-12 hours',
          details: { currentCpu: sysInfo.cpu, threshold: 90 },
          preventativeActions: ['Scale up compute resources', 'Optimize CPU-intensive processes', 'Enable request queuing'],
          createdAt: new Date(),
        });
      }

      // Disk space prediction
      if (sysInfo.disk > 75) {
        const daysUntilFull = sysInfo.disk > 85 ? 3 : 14;
        predictions.push({
          id: generateId('pred'),
          agentId: 'infrastructure',
          type: 'resource_exhaustion',
          confidence: 0.75,
          timeframe: `~${daysUntilFull} days`,
          details: { currentDisk: sysInfo.disk, estimatedDays: daysUntilFull },
          preventativeActions: ['Clean up old logs and temp files', 'Expand storage capacity', 'Archive old data'],
          createdAt: new Date(),
        });
      }

      // Memory leak prediction
      if (sysInfo.ram > 80) {
        predictions.push({
          id: generateId('pred'),
          agentId: 'debugging',
          type: 'performance_degradation',
          confidence: 0.7,
          timeframe: '2-4 hours',
          details: { currentRam: sysInfo.ram, ramUsed: sysInfo.ramUsed, ramTotal: sysInfo.ramTotal },
          preventativeActions: ['Restart application processes', 'Check for memory leaks', 'Enable memory monitoring alerts'],
          createdAt: new Date(),
        });
      }

      // Check for pattern-based predictions
      const recentFailures = await prisma.agentTask.count({
        where: { status: 'failed', createdAt: { gte: new Date(Date.now() - 86400000) } },
      });
      if (recentFailures > 3) {
        predictions.push({
          id: generateId('pred'),
          agentId: 'supervisor',
          type: 'failure',
          confidence: 0.65,
          timeframe: 'Next 24 hours',
          details: { recentFailures, pattern: 'increasing_failure_rate' },
          preventativeActions: ['Review recent failures for common causes', 'Pre-emptively restart services', 'Increase monitoring frequency'],
          createdAt: new Date(),
        });
      }

    } catch {}

    return predictions;
  }

  // ============ WORKFLOW EVOLUTION ============

  async evolveWorkflow(workflowType: string, currentSteps: any[]): Promise<{ optimized: boolean; newSteps: any[]; reasoning: string }> {
    // Analyze past executions of similar workflows
    try {
      const pastExecutions = await prisma.agentMemory.findMany({
        where: { type: 'agent_learning', key: { contains: workflowType } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (pastExecutions.length < 3) {
        return { optimized: false, newSteps: currentSteps, reasoning: 'Insufficient historical data for optimization' };
      }

      // Calculate average success rate
      let successCount = 0;
      for (const exec of pastExecutions) {
        try {
          const data = JSON.parse(exec.value);
          if (data.score > 0) successCount++;
        } catch {}
      }

      const successRate = successCount / pastExecutions.length;
      if (successRate > 0.8) {
        return { optimized: true, newSteps: currentSteps, reasoning: `Workflow has ${successRate.toFixed(0)}% success rate - no optimization needed` };
      }

      // Suggest optimizations based on failure patterns
      const optimizedSteps = currentSteps.map((step, i) => ({
        ...step,
        retryCount: (step.retryCount || 0) + (successRate < 0.5 ? 1 : 0),
        timeout: step.timeout ? step.timeout * 1.5 : undefined,
      }));

      return {
        optimized: true,
        newSteps: optimizedSteps,
        reasoning: `Workflow optimized: increased timeouts and retries based on ${successRate.toFixed(0)}% success rate from ${pastExecutions.length} past executions`,
      };
    } catch {
      return { optimized: false, newSteps: currentSteps, reasoning: 'Analysis failed - keeping current workflow' };
    }
  }

  // ============ CROSS-PROJECT LEARNING ============

  async crossProjectInsights(userId: string): Promise<{ insights: string[]; applicablePatterns: any[] }> {
    const insights: string[] = [];
    const applicablePatterns: any[] = [];

    try {
      // Get all user's learning data
      const userLearning = await prisma.agentMemory.findMany({
        where: { userId, type: 'agent_learning', relevance: { gte: 0.5 } },
        orderBy: { relevance: 'desc' },
        take: 50,
      });

      // Extract patterns
      const successfulPatterns = userLearning.filter(m => {
        try { return JSON.parse(m.value).score > 0.5; } catch { return false; }
      });

      const failedPatterns = userLearning.filter(m => {
        try { return JSON.parse(m.value).score < -0.3; } catch { return false; }
      });

      if (successfulPatterns.length > 5) {
        insights.push(`Found ${successfulPatterns.length} successful patterns that can be reused across projects`);
      }

      if (failedPatterns.length > 3) {
        insights.push(`Identified ${failedPatterns.length} failure patterns to avoid in new deployments`);
      }

      // Get common deployment patterns
      const deploymentMemories = await prisma.agentMemory.findMany({
        where: { type: 'deployment', relevance: { gte: 0.6 } },
        take: 10,
      });

      for (const mem of deploymentMemories) {
        try {
          const data = JSON.parse(mem.value);
          if (data.framework) {
            applicablePatterns.push({
              type: 'deployment',
              framework: data.framework,
              bestPractice: 'Use optimized build configuration based on past successes',
            });
          }
        } catch {}
      }

    } catch {}

    return { insights, applicablePatterns };
  }

  // ============ AUTONOMOUS OPTIMIZATION STRATEGY ============

  async generateOptimizationStrategy(userId: string): Promise<{
    strategies: { category: string; actions: string[]; expectedImpact: string; confidence: number }[];
    overallScore: number;
  }> {
    const strategies = [];

    try {
      const { getSystemInfo } = require('@/lib/sysutils');
      const sysInfo = getSystemInfo();

      if (sysInfo.cpu > 60) {
        strategies.push({
          category: 'CPU Optimization',
          actions: ['Enable process pooling', 'Implement request queuing', 'Optimize compute-intensive operations', 'Enable caching for repeated computations'],
          expectedImpact: '30-50% CPU reduction',
          confidence: 0.8,
        });
      }

      if (sysInfo.ram > 60) {
        strategies.push({
          category: 'Memory Optimization',
          actions: ['Implement object pooling', 'Enable garbage collection tuning', 'Add memory limits to containers', 'Use streaming for large data'],
          expectedImpact: '20-40% memory reduction',
          confidence: 0.75,
        });
      }

      // General strategies
      strategies.push({
        category: 'Application Performance',
        actions: ['Enable gzip compression', 'Implement Redis caching', 'Use CDN for static assets', 'Optimize database queries', 'Enable HTTP/2'],
        expectedImpact: '40-60% response time improvement',
        confidence: 0.85,
      });

      strategies.push({
        category: 'Security Hardening',
        actions: ['Rotate secrets and tokens', 'Update SSL certificates', 'Review access permissions', 'Enable rate limiting', 'Scan for vulnerabilities'],
        expectedImpact: 'Enhanced security posture',
        confidence: 0.9,
      });

    } catch {
      strategies.push({
        category: 'System Analysis',
        actions: ['Run comprehensive diagnostics', 'Review recent logs', 'Check resource utilization'],
        expectedImpact: 'Baseline understanding',
        confidence: 0.5,
      });
    }

    const overallScore = strategies.reduce((sum, s) => sum + s.confidence, 0) / strategies.length * 100;

    return { strategies, overallScore: Math.round(overallScore) };
  }
}

// ============ SINGLETON ============

let learningInstance: LearningEngine | null = null;

export function getLearningEngine(): LearningEngine {
  if (!learningInstance) {
    learningInstance = new LearningEngine();
  }
  return learningInstance;
}
