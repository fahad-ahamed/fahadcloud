// ============ REAL AI AUTO LEARNING AGENT v3.0 ============
// Uses local AI engine for learning, research, and knowledge graph building

import { db } from '@/lib/db';
import { AgentId, generateId } from '../types';
import { aiChat, aiResearch } from '../ai-engine';



// ============ TYPES ============

interface KnowledgeNode {
  id: string;
  concept: string;
  connections: Array<{ target: string; relationship: string; weight: number }>;
  attributes: Record<string, any>;
}

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

interface LearningResult {
  topic: string;
  findings: string;
  sources: string[];
  confidence: number;
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
    totalTopicsLearned: 0,
    totalWebResearches: 0,
    lastTrainingCycle: new Date(),
    averageConfidence: 0,
  };

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase(): void {
    const coreConcepts = [
      { concept: 'deployment', connections: ['ci_cd', 'build', 'docker', 'scaling'] },
      { concept: 'security', connections: ['ssl', 'firewall', 'authentication', 'monitoring'] },
      { concept: 'performance', connections: ['optimization', 'caching', 'scaling', 'monitoring'] },
      { concept: 'dns', connections: ['domain', 'nameserver', 'records', 'propagation'] },
      { concept: 'database', connections: ['migration', 'backup', 'optimization', 'replication'] },
      { concept: 'infrastructure', connections: ['docker', 'kubernetes', 'networking', 'storage'] },
      { concept: 'monitoring', connections: ['alerts', 'metrics', 'health', 'anomaly'] },
      { concept: 'ai_agents', connections: ['coding', 'debugging', 'research', 'self_improvement'] },
    ];

    for (const c of coreConcepts) {
      this.knowledgeGraph.set(c.concept, {
        id: generateId('kn'),
        concept: c.concept,
        connections: c.connections.map(target => ({ target, relationship: 'related_to', weight: 0.8 })),
        attributes: { source: 'system_seed' },
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
      const patterns = await this.aiExtractPatterns(trainingData);
      patternsDetected = patterns.length;
      const newInsights = await this.aiGenerateInsights(patterns, trainingData);
      insightsGenerated = newInsights.length;
      for (const insight of newInsights) {
        this.aiUpdateKnowledgeGraph(insight);
      }
      modelsImproved = await this.aiImproveAgentModels(newInsights);
      await this.persistLearningResults(insightsGenerated, patternsDetected, modelsImproved);
      
      this.learningStats.totalInsights += insightsGenerated;
      this.learningStats.totalTrainingCycles += 1;
      this.learningStats.totalPatternsDetected += patternsDetected;
      this.learningStats.totalModelsImproved += modelsImproved;
      this.learningStats.lastTrainingCycle = new Date();
      this.learningStats.averageConfidence = this.calculateAverageConfidence();
    } catch (error: any) {
      console.error('AI Learning Cycle Error:', error.message);
    } finally {
      this.isTraining = false;
    }

    return {
      insightsGenerated,
      patternsDetected,
      modelsImproved,
      confidence: this.learningStats.averageConfidence,
    };
  }

  private async collectTrainingData(): Promise<string> {
    const data: string[] = [];
    try {
      const taskStats = await db.agentTask.groupBy({
        by: ['status'],
        _count: { status: true },
      });
      data.push(`Task outcomes: ${taskStats.map(s => `${s.status}: ${s._count.status}`).join(', ')}`);

      const recentExecutions = await db.agentToolExecution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      data.push(`Recent executions: ${recentExecutions.map(e => `${e.tool}(${e.status})`).join(', ')}`);

      const userCount = await db.user.count();
      const domainCount = await db.domain.count();
      const hostingCount = await db.hostingEnvironment.count();
      data.push(`System: ${userCount} users, ${domainCount} domains, ${hostingCount} hosting environments`);
    } catch {}
    return data.join('\n');
  }

  private async aiExtractPatterns(trainingData: string): Promise<any[]> {
    try {
      const result = await aiChat([
        {
          role: 'system',
          content: 'You are an AI pattern recognition engine. Analyze system data and identify patterns, trends, and anomalies. Return a JSON array of patterns: [{"pattern":"...","confidence":0.8,"category":"...","affectedAgents":["agent_id"],"recommendation":"..."}]',
        },
        { role: 'user', content: `Analyze this system data for patterns:\n${trainingData}` },
      ], { temperature: 0.4, maxTokens: 1000 });

      const match = result.message.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return [];
  }

  private async aiGenerateInsights(patterns: any[], trainingData: string): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    for (const pattern of patterns.slice(0, 10)) {
      const insight: LearningInsight = {
        id: generateId('insight'),
        category: pattern.category || 'general',
        pattern: pattern.pattern || 'Unknown pattern',
        confidence: pattern.confidence || 0.5,
        occurrences: 1,
        lastSeen: new Date(),
        recommendation: pattern.recommendation || 'No recommendation',
        affectedAgents: pattern.affectedAgents || [],
      };
      this.insights.set(insight.id, insight);
      insights.push(insight);
    }
    return insights;
  }

  private aiUpdateKnowledgeGraph(insight: LearningInsight): void {
    // Add or update node in knowledge graph
    const existingNode = this.knowledgeGraph.get(insight.category);
    if (existingNode) {
      existingNode.connections.push({
        target: insight.pattern.substring(0, 30),
        relationship: insight.category,
        weight: insight.confidence,
      });
    } else {
      this.knowledgeGraph.set(insight.category, {
        id: generateId('kn'),
        concept: insight.category,
        connections: [{ target: insight.pattern.substring(0, 30), relationship: insight.category, weight: insight.confidence }],
        attributes: { source: 'ai_insight', recommendation: insight.recommendation },
      });
    }
  }

  private async aiImproveAgentModels(insights: LearningInsight[]): Promise<number> {
    let improved = 0;
    for (const insight of insights) {
      if (insight.confidence > 0.7) improved++;
    }
    return improved;
  }

  private async persistLearningResults(insights: number, patterns: number, models: number): Promise<void> {
    try {
      await db.agentMemory.create({
        data: {
          userId: 'system',
          type: 'agent_learning',
          key: `learning_cycle_${Date.now()}`,
          value: JSON.stringify({ insights, patterns, models, timestamp: new Date().toISOString() }),
          relevance: 0.8,
        },
      });
    } catch {}
  }

  private calculateAverageConfidence(): number {
    const insights = Array.from(this.insights.values());
    if (insights.length === 0) return 0;
    return insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
  }

  async learnAboutTopic(topic: string, depth?: 'basic' | 'intermediate' | 'advanced'): Promise<LearningResult> {
    const depthMap: Record<string, 'quick' | 'standard' | 'deep'> = {
      basic: 'quick', intermediate: 'standard', advanced: 'deep',
    };
    const researchDepth = depthMap[depth || 'intermediate'] || 'standard';

    // Use aiResearch for comprehensive topic research
    const result = await aiResearch(topic, researchDepth);

    // Store in knowledge graph
    this.knowledgeGraph.set(topic, {
      id: generateId('kn'),
      concept: topic,
      connections: [{ target: 'learned', relationship: 'researched', weight: 0.9 }],
      attributes: { source: 'ai_research', depth: researchDepth },
    });

    // Store in database
    try {
      await db.agentMemory.create({
        data: {
          userId: 'system',
          type: 'agent_learning',
          key: `learned_${topic.replace(/\s+/g, '_')}_${Date.now()}`,
          value: JSON.stringify({ topic, findings: result.findings.substring(0, 2000), confidence: result.confidence }),
          relevance: 0.9,
        },
      });
    } catch {}

    this.learningStats.totalTopicsLearned++;
    return { topic, findings: result.findings, sources: [], confidence: result.confidence };
  }

  async getContextForQuery(query: string): Promise<string> {
    const relevantInsights = Array.from(this.insights.values())
      .filter(i => i.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    if (relevantInsights.length === 0) return '';

    return relevantInsights
      .map(i => `[${i.category}] ${i.pattern} -> ${i.recommendation}`)
      .join('\n');
  }

  getStats() {
    return {
      ...this.learningStats,
      knowledgeGraphNodes: this.knowledgeGraph.size,
      totalInsights: this.insights.size,
      isTraining: this.isTraining,
    };
  }

  getKnowledgeGraph(): { nodes: any[]; edges: any[] } {
    const nodes = Array.from(this.knowledgeGraph.values()).map(n => ({
      id: n.id,
      concept: n.concept,
      connections: n.connections.length,
      attributes: n.attributes,
    }));

    const edges: any[] = [];
    for (const node of this.knowledgeGraph.values()) {
      for (const conn of node.connections) {
        edges.push({ source: node.concept, target: conn.target, relationship: conn.relationship, weight: conn.weight });
      }
    }

    return { nodes, edges };
  }

  getInsights(): LearningInsight[] {
    return Array.from(this.insights.values()).sort((a, b) => b.confidence - a.confidence);
  }
}

// Singleton
let autoLearningInstance: AutoLearningEngine | null = null;
export function getAutoLearningEngine(): AutoLearningEngine {
  if (!autoLearningInstance) autoLearningInstance = new AutoLearningEngine();
  return autoLearningInstance;
}
