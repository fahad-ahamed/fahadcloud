// ============ AUTO LEARNING AGENT ============
// Continuously trains and improves all FahadCloud AI agents
// using project data, user interactions, system metrics,
// and cross-domain insights. Unlimited, scalable, autonomous.

import { PrismaClient } from '@prisma/client';
import { AgentId, LearningRecord, Prediction, generateId } from '../types';

const prisma = new PrismaClient();

// ============ LEARNING DATA STRUCTURES ============

interface LearningInsight {
  id: string;
  category: string;
  pattern: string;
  confidence: number;
  occurrences: number;
  lastSeen: Date;
  recommendation: string;
  affectedAgents: AgentId[];
}

interface KnowledgeNode {
  id: string;
  concept: string;
  connections: string[];
  weight: number;
  lastUpdated: Date;
  source: string;
}

// ============ AUTO LEARNING ENGINE ============

export class AutoLearningEngine {
  private knowledgeGraph: Map<string, KnowledgeNode> = new Map();
  private insights: Map<string, LearningInsight> = new Map();
  private isTraining: boolean = false;
  private learningStats = {
    totalInsights: 0,
    totalTrainingCycles: 0,
    totalPatternsDetected: 0,
    totalModelsImproved: 0,
    lastTrainingCycle: new Date(),
    averageConfidence: 0,
  };

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase(): void {
    const coreConcepts = [
      { concept: 'deployment', connections: ['ci_cd', 'build', 'docker', 'scaling'], weight: 1.0, source: 'system' },
      { concept: 'security', connections: ['ssl', 'firewall', 'authentication', 'monitoring'], weight: 1.0, source: 'system' },
      { concept: 'performance', connections: ['optimization', 'caching', 'scaling', 'monitoring'], weight: 1.0, source: 'system' },
      { concept: 'dns', connections: ['domain', 'nameserver', 'records', 'propagation'], weight: 1.0, source: 'system' },
      { concept: 'database', connections: ['migration', 'backup', 'optimization', 'replication'], weight: 1.0, source: 'system' },
      { concept: 'infrastructure', connections: ['docker', 'kubernetes', 'networking', 'storage'], weight: 1.0, source: 'system' },
      { concept: 'monitoring', connections: ['alerts', 'metrics', 'health', 'anomaly'], weight: 1.0, source: 'system' },
      { concept: 'user_behavior', connections: ['preferences', 'patterns', 'workflow', 'efficiency'], weight: 0.8, source: 'observation' },
    ];

    for (const c of coreConcepts) {
      this.knowledgeGraph.set(c.concept, {
        id: generateId('kn'),
        concept: c.concept,
        connections: c.connections,
        weight: c.weight,
        lastUpdated: new Date(),
        source: c.source,
      });
    }
  }

  async runLearningCycle(): Promise<{
    insightsGenerated: number;
    patternsDetected: number;
    modelsImproved: number;
    confidence: number;
  }> {
    if (this.isTraining) {
      return { insightsGenerated: 0, patternsDetected: 0, modelsImproved: 0, confidence: 0 };
    }
    this.isTraining = true;
    let insightsGenerated = 0;
    let patternsDetected = 0;
    let modelsImproved = 0;

    try {
      const trainingData = await this.collectTrainingData();
      const patterns = this.extractPatterns(trainingData);
      patternsDetected = patterns.length;
      const newInsights = this.generateInsights(patterns);
      insightsGenerated = newInsights.length;
      for (const insight of newInsights) { this.updateKnowledgeGraph(insight); }
      modelsImproved = await this.improveAgentModels(newInsights);
      await this.persistLearningResults(insightsGenerated, patternsDetected, modelsImproved);
      this.learningStats.totalInsights += insightsGenerated;
      this.learningStats.totalTrainingCycles += 1;
      this.learningStats.totalPatternsDetected += patternsDetected;
      this.learningStats.totalModelsImproved += modelsImproved;
      this.learningStats.lastTrainingCycle = new Date();
      this.learningStats.averageConfidence = this.calculateAverageConfidence();
    } catch (error: any) {
      console.error('[AUTO LEARNING] Cycle error:', error.message);
    } finally {
      this.isTraining = false;
    }
    return { insightsGenerated, patternsDetected, modelsImproved, confidence: this.learningStats.averageConfidence };
  }

  private async collectTrainingData(): Promise<any[]> {
    const data: any[] = [];
    try {
      const executions = await prisma.agentToolExecution.findMany({ take: 100, orderBy: { executedAt: 'desc' } });
      data.push(...executions.map(e => ({ source: 'tool_execution', agentId: e.tool, input: e.input, output: e.output, status: e.status, timestamp: e.executedAt, riskLevel: e.riskLevel })));
    } catch {}
    try {
      const memories = await prisma.agentMemory.findMany({ take: 200, orderBy: { lastAccessed: 'desc' } });
      data.push(...memories.map(m => ({ source: 'memory', type: m.type, key: m.key, value: m.value, relevance: m.relevance, accessCount: m.accessCount, timestamp: m.lastAccessed })));
    } catch {}
    try {
      const messages = await prisma.agentMessage.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
      data.push(...messages.map(m => ({ source: 'user_interaction', role: m.role, content: m.content?.substring(0, 500), metadata: m.metadata, timestamp: m.createdAt })));
    } catch {}
    try {
      const tasks = await prisma.agentTask.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
      data.push(...tasks.map(t => ({ source: 'task', type: t.type, status: t.status, priority: t.priority, timestamp: t.createdAt })));
    } catch {}
    return data;
  }

  private extractPatterns(data: any[]): any[] {
    const patterns: any[] = [];
    const actionCounts: Record<string, number> = {};
    for (const d of data) {
      if (d.source === 'tool_execution') {
        const key = d.agentId + '_' + d.status;
        actionCounts[key] = (actionCounts[key] || 0) + 1;
      }
    }
    for (const [key, count] of Object.entries(actionCounts)) {
      if (count >= 3) patterns.push({ type: 'frequency', pattern: key, count, confidence: Math.min(count / 10, 0.95) });
    }
    const failurePatterns: Record<string, number> = {};
    for (const d of data) {
      if (d.source === 'tool_execution' && d.status === 'failed') {
        const key = 'failure_' + d.agentId;
        failurePatterns[key] = (failurePatterns[key] || 0) + 1;
      }
    }
    for (const [key, count] of Object.entries(failurePatterns)) {
      if (count >= 2) patterns.push({ type: 'failure', pattern: key, count, confidence: Math.min(count / 5, 0.9), recommendation: 'Agent ' + key.replace('failure_', '') + ' has ' + count + ' failures. Consider improving error handling.' });
    }
    const completedTasks = data.filter(d => d.source === 'task' && d.status === 'completed');
    const failedTasks = data.filter(d => d.source === 'task' && d.status === 'failed');
    if (completedTasks.length > 0 || failedTasks.length > 0) {
      const successRate = completedTasks.length / (completedTasks.length + failedTasks.length);
      patterns.push({ type: 'task_success_rate', pattern: (successRate * 100).toFixed(1) + '% success rate', count: completedTasks.length + failedTasks.length, confidence: 0.9, successRate });
    }
    return patterns;
  }

  private generateInsights(patterns: any[]): LearningInsight[] {
    const newInsights: LearningInsight[] = [];
    for (const pattern of patterns) {
      const insightId = generateId('insight');
      const affectedAgents = this.determineAffectedAgents(pattern);
      const insight: LearningInsight = {
        id: insightId, category: pattern.type, pattern: pattern.pattern,
        confidence: pattern.confidence, occurrences: pattern.count,
        lastSeen: new Date(), recommendation: pattern.recommendation || this.generateRecommendation(pattern),
        affectedAgents,
      };
      newInsights.push(insight);
      this.insights.set(insightId, insight);
    }
    return newInsights;
  }

  private determineAffectedAgents(pattern: any): AgentId[] {
    const patternStr = (pattern.pattern || '').toLowerCase();
    const agentKeywords: Record<string, string[]> = {
      devops: ['deploy', 'build', 'ci_cd', 'pipeline'],
      security: ['security', 'ssl', 'firewall', 'threat'],
      deployment: ['deploy', 'framework', 'release'],
      monitoring: ['monitor', 'metric', 'alert', 'health'],
      debugging: ['error', 'debug', 'failure', 'fix'],
      infrastructure: ['docker', 'server', 'container'],
      database: ['database', 'migration', 'backup'],
      optimization: ['optimize', 'performance', 'cache'],
      recovery: ['backup', 'restore', 'recovery'],
      scaling: ['scale', 'load', 'capacity'],
      dns_domain: ['dns', 'domain', 'nameserver'],
      payment: ['payment', 'bkash', 'transaction'],
      supervisor: ['orchestrat', 'coordinate', 'plan'],
      auto_learning: ['learn', 'train', 'pattern'],
    };
    const affected: AgentId[] = [];
    for (const [agentId, keywords] of Object.entries(agentKeywords)) {
      if (keywords.some(k => patternStr.includes(k))) affected.push(agentId as AgentId);
    }
    return affected.length > 0 ? affected : ['supervisor' as AgentId];
  }

  private generateRecommendation(pattern: any): string {
    switch (pattern.type) {
      case 'frequency': return 'Frequent ' + pattern.pattern + ' detected. Consider optimizing this workflow.';
      case 'failure': return 'Repeated failures in ' + pattern.pattern + '. Add better error handling.';
      default: return 'Pattern detected: ' + pattern.pattern + '. Consider investigating for optimization.';
    }
  }

  private updateKnowledgeGraph(insight: LearningInsight): void {
    const concept = insight.category;
    const existing = this.knowledgeGraph.get(concept);
    if (existing) {
      existing.weight = Math.min(existing.weight + 0.05 * insight.confidence, 2.0);
      existing.lastUpdated = new Date();
      for (const agent of insight.affectedAgents) {
        if (!existing.connections.includes(agent)) existing.connections.push(agent);
      }
    } else {
      this.knowledgeGraph.set(concept, { id: generateId('kn'), concept, connections: insight.affectedAgents, weight: insight.confidence, lastUpdated: new Date(), source: 'auto_learning' });
    }
  }

  private async improveAgentModels(insights: LearningInsight[]): Promise<number> {
    let improved = 0;
    for (const insight of insights) {
      if (insight.confidence < 0.6) continue;
      for (const agentId of insight.affectedAgents) {
        try {
          await prisma.agentMemory.create({ data: { userId: 'system', type: 'auto_learning_improvement', key: 'improvement_' + agentId + '_' + Date.now(), value: JSON.stringify({ insight: insight.pattern, recommendation: insight.recommendation, confidence: insight.confidence, category: insight.category, appliedAt: new Date().toISOString() }), relevance: insight.confidence } });
          improved++;
        } catch {}
      }
    }
    return improved;
  }

  private async persistLearningResults(insights: number, patterns: number, models: number): Promise<void> {
    try {
      await prisma.agentMemory.create({ data: { userId: 'system', type: 'auto_learning_cycle', key: 'cycle_' + Date.now(), value: JSON.stringify({ insights, patterns, models, timestamp: new Date().toISOString(), stats: this.learningStats }), relevance: 0.8 } });
    } catch {}
  }

  private calculateAverageConfidence(): number {
    const all = Array.from(this.insights.values());
    if (all.length === 0) return 0;
    return all.reduce((sum, i) => sum + i.confidence, 0) / all.length;
  }

  getStats() { return { ...this.learningStats, knowledgeNodes: this.knowledgeGraph.size, totalInsights: this.insights.size, isTraining: this.isTraining }; }
  getInsights(category?: string): LearningInsight[] { const all = Array.from(this.insights.values()); return category ? all.filter(i => i.category === category) : all; }
  getKnowledgeGraph(): { nodes: number; topConcepts: { concept: string; weight: number; connections: string[] }[] } {
    const nodes = Array.from(this.knowledgeGraph.values());
    return { nodes: nodes.length, topConcepts: nodes.sort((a, b) => b.weight - a.weight).slice(0, 20).map(n => ({ concept: n.concept, weight: n.weight, connections: n.connections })) };
  }

  async getContextForQuery(query: string): Promise<string> {
    const q = query.toLowerCase();
    const relevantNodes = Array.from(this.knowledgeGraph.values()).filter(n => q.includes(n.concept.toLowerCase()) || n.connections.some(c => q.includes(c.toLowerCase()))).sort((a, b) => b.weight - a.weight).slice(0, 5);
    const relevantInsights = Array.from(this.insights.values()).filter(i => q.includes(i.category.toLowerCase()) || i.affectedAgents.some(a => q.includes(a.toLowerCase()))).sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    let context = '';
    if (relevantNodes.length > 0) context += 'Knowledge: ' + relevantNodes.map(n => n.concept + ' (w:' + n.weight.toFixed(2) + ')').join('; ');
    if (relevantInsights.length > 0) context += ' | Insights: ' + relevantInsights.map(i => i.pattern + ' (' + (i.confidence * 100).toFixed(0) + '%: ' + i.recommendation + ')').join('; ');
    return context;
  }

  async predictWithLearning(userId: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const failureInsights = Array.from(this.insights.values()).filter(i => i.category === 'failure' && i.confidence > 0.5);
    for (const insight of failureInsights) {
      predictions.push({ id: generateId('pred'), agentId: insight.affectedAgents[0] || 'supervisor', type: 'potential_failure', confidence: insight.confidence * 0.8, timeframe: 'Next 24 hours', details: { pattern: insight.pattern, occurrences: insight.occurrences }, preventativeActions: [insight.recommendation], createdAt: new Date() });
    }
    const optInsights = Array.from(this.insights.values()).filter(i => i.category === 'frequency' && i.confidence > 0.7);
    for (const insight of optInsights) {
      predictions.push({ id: generateId('pred'), agentId: insight.affectedAgents[0] || 'optimization', type: 'optimization_opportunity', confidence: insight.confidence * 0.9, timeframe: 'Ongoing', details: { pattern: insight.pattern, count: insight.occurrences }, preventativeActions: [insight.recommendation], createdAt: new Date() });
    }
    return predictions;
  }

  async crossProjectInsights(userId: string): Promise<any[]> {
    try {
      const userMemories = await prisma.agentMemory.findMany({ where: { userId, relevance: { gte: 0.5 } }, take: 50, orderBy: { relevance: 'desc' } });
      return userMemories.map(m => ({ type: m.type, key: m.key, relevance: m.relevance, insight: 'Pattern in ' + m.type + ': ' + m.key }));
    } catch { return []; }
  }

  async generateOptimizationStrategy(userId: string): Promise<any> {
    const insights = Array.from(this.insights.values());
    const hc = insights.filter(i => i.confidence > 0.7);
    return { totalInsights: insights.length, actionableInsights: hc.length, topRecommendations: hc.sort((a, b) => b.confidence - a.confidence).slice(0, 5).map(i => ({ category: i.category, recommendation: i.recommendation, confidence: i.confidence, affectedAgents: i.affectedAgents })), knowledgeCoverage: this.knowledgeGraph.size, learningProgress: this.learningStats.totalTrainingCycles };
  }
}

let autoLearningInstance: AutoLearningEngine | null = null;
export function getAutoLearningEngine(): AutoLearningEngine {
  if (!autoLearningInstance) autoLearningInstance = new AutoLearningEngine();
  return autoLearningInstance;
}
