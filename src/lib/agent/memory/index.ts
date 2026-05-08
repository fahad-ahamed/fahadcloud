// ============ HYBRID MEMORY ARCHITECTURE ============
// Short-term, Long-term, Semantic, Workflow, Infrastructure, Deployment memory
// Vector-based similarity search and retrieval-augmented reasoning

import { PrismaClient } from '@prisma/client';
import { MemoryType, MemoryEntry, MemoryQuery, AgentId, generateId } from '../types';

const prisma = new PrismaClient();

// ============ MEMORY CATEGORIES ============

const MEMORY_TTL: Record<MemoryType, number> = {
  short_term: 1 * 60 * 60 * 1000,        // 1 hour
  long_term: 365 * 24 * 60 * 60 * 1000,  // 1 year
  semantic: 180 * 24 * 60 * 60 * 1000,   // 6 months
  workflow: 30 * 24 * 60 * 60 * 1000,    // 30 days
  infrastructure: 90 * 24 * 60 * 60 * 1000, // 90 days
  deployment: 90 * 24 * 60 * 60 * 1000,  // 90 days
  security: 180 * 24 * 60 * 60 * 1000,   // 6 months
  performance: 30 * 24 * 60 * 60 * 1000, // 30 days
  error_solution: 365 * 24 * 60 * 60 * 1000, // 1 year (keep error solutions long)
  user_preference: 365 * 24 * 60 * 60 * 1000, // 1 year
  project_context: 180 * 24 * 60 * 60 * 1000, // 6 months
  agent_learning: 90 * 24 * 60 * 60 * 1000, // 90 days
  optimization_history: 90 * 24 * 60 * 60 * 1000, // 90 days
};

// ============ MEMORY STORE ============

export class HybridMemoryStore {
  private cache: Map<string, MemoryEntry> = new Map();
  private maxCacheSize = 500;

  // ============ STORE ============

  async store(
    userId: string,
    type: MemoryType,
    category: string,
    key: string,
    value: any,
    source: AgentId,
    tags: string[] = [],
    connections: string[] = []
  ): Promise<string> {
    const id = generateId('mem');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MEMORY_TTL[type]);

    const entry: MemoryEntry = {
      id,
      type,
      category,
      key,
      value,
      relevance: 1.0,
      accessCount: 0,
      createdAt: now,
      lastAccessed: now,
      expiresAt,
      tags,
      source,
      connections,
    };

    // Store in cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(id, entry);

    // Persist to database
    try {
      const existing = await prisma.agentMemory.findFirst({ where: { userId, type, key } });
      if (existing) {
        await prisma.agentMemory.update({
          where: { id: existing.id },
          data: {
            value: JSON.stringify(value),
            relevance: Math.min(existing.relevance + 0.1, 1.0),
            accessCount: existing.accessCount + 1,
            lastAccessed: now,
          },
        });
        return existing.id;
      } else {
        await prisma.agentMemory.create({
          data: {
            userId,
            type,
            key,
            value: JSON.stringify({ ...value, _meta: { category, tags, source, connections } }),
            relevance: 1.0,
            expiresAt,
          },
        });
        return id;
      }
    } catch {
      return id;
    }
  }

  // ============ RECALL ============

  async recall(userId: string, query: MemoryQuery): Promise<MemoryEntry[]> {
    const where: any = { userId, relevance: { gte: query.minRelevance || 0.3 } };
    if (query.types && query.types.length > 0) where.type = { in: query.types };
    if (query.category) where.key = { contains: query.category };
    if (query.key) where.key = { contains: query.key };
    if (query.timeRange) {
      where.createdAt = { gte: query.timeRange.from, lte: query.timeRange.to };
    }

    try {
      const memories = await prisma.agentMemory.findMany({
        where,
        orderBy: [{ relevance: 'desc' }, { lastAccessed: 'desc' }],
        take: query.limit || 20,
      });

      return memories.map(m => ({
        id: m.id,
        type: m.type as MemoryType,
        category: '',
        key: m.key,
        value: JSON.parse(m.value || '{}'),
        relevance: m.relevance,
        accessCount: m.accessCount,
        createdAt: m.createdAt,
        lastAccessed: m.lastAccessed,
        expiresAt: m.expiresAt || undefined,
        tags: [],
        source: 'supervisor' as AgentId,
        connections: [],
      }));
    } catch {
      return [];
    }
  }

  // ============ SEMANTIC SEARCH ============

  async semanticSearch(userId: string, query: string, limit: number = 10): Promise<MemoryEntry[]> {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (keywords.length === 0) return [];

    try {
      const allMemories = await prisma.agentMemory.findMany({
        where: { userId, relevance: { gte: 0.2 } },
        take: 100,
      });

      const scored = allMemories.map(m => {
        const valueStr = JSON.stringify(m.value).toLowerCase();
        const keyStr = m.key.toLowerCase();
        const fullText = `${keyStr} ${valueStr}`;
        
        let score = 0;
        for (const keyword of keywords) {
          if (fullText.includes(keyword)) score += 0.3;
          if (keyStr.includes(keyword)) score += 0.5;
        }
        
        score += m.relevance * 0.3;
        score += Math.min(m.accessCount * 0.05, 0.5);
        
        return { memory: m, score: Math.min(score, 1.0) };
      });

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, limit).map(s => ({
        id: s.memory.id,
        type: s.memory.type as MemoryType,
        category: '',
        key: s.memory.key,
        value: JSON.parse(s.memory.value || '{}'),
        relevance: s.score,
        accessCount: s.memory.accessCount,
        createdAt: s.memory.createdAt,
        lastAccessed: s.memory.lastAccessed,
        tags: [],
        source: 'supervisor' as AgentId,
        connections: [],
      }));
    } catch {
      return [];
    }
  }

  // ============ RETRIEVAL-AUGMENTED REASONING ============

  async augmentWithContext(userId: string, query: string): Promise<{
    relevantMemories: MemoryEntry[];
    contextSummary: string;
    suggestedActions: string[];
  }> {
    const memories = await this.semanticSearch(userId, query, 5);
    
    let contextSummary = '';
    const suggestedActions: string[] = [];

    if (memories.length > 0) {
      contextSummary = `Based on ${memories.length} relevant memories:\n`;
      for (const mem of memories) {
        const valueStr = typeof mem.value === 'string' ? mem.value : JSON.stringify(mem.value).substring(0, 200);
        contextSummary += `- [${mem.type}] ${mem.key}: ${valueStr}\n`;
        
        // Extract suggested actions from workflow and error_solution memories
        if (mem.type === 'error_solution' && mem.value?.fix) {
          suggestedActions.push(`Apply known fix: ${mem.value.fix}`);
        }
        if (mem.type === 'workflow' && mem.value?.successfulSteps) {
          suggestedActions.push(`Reuse successful workflow from previous session`);
        }
      }
    } else {
      contextSummary = 'No relevant prior context found. Starting fresh analysis.';
    }

    return { relevantMemories: memories, contextSummary, suggestedActions };
  }

  // ============ MEMORY DECAY ============

  async decayRelevance(): Promise<void> {
    try {
      await prisma.agentMemory.updateMany({
        where: { lastAccessed: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        data: { relevance: { multiply: 0.95 } },
      });
      await prisma.agentMemory.deleteMany({
        where: { relevance: { lt: 0.1 } },
      });
      // Clean up expired
      await prisma.agentMemory.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    } catch {}
  }

  // ============ STORE INFRASTRUCTURE SNAPSHOT ============

  async storeInfrastructureSnapshot(userId: string, data: any): Promise<void> {
    await this.store(userId, 'infrastructure', 'system_snapshot', `snapshot_${Date.now()}`, data, 'monitoring', ['system', 'snapshot']);
  }

  async storeDeploymentRecord(userId: string, framework: string, domain: string, result: any): Promise<void> {
    await this.store(userId, 'deployment', framework, `deploy_${domain}_${Date.now()}`, { framework, domain, result, timestamp: new Date().toISOString() }, 'deployment', [framework, domain]);
  }

  async storeErrorSolution(userId: string, error: string, fix: string, context: string): Promise<void> {
    await this.store(userId, 'error_solution', context, `fix_${error.substring(0, 50)}`, { error, fix, context }, 'debugging', ['error', 'fix', context]);
  }

  async storeOptimizationResult(userId: string, type: string, before: any, after: any): Promise<void> {
    await this.store(userId, 'optimization_history', type, `opt_${Date.now()}`, { type, before, after, improvement: typeof before === 'number' && typeof after === 'number' ? ((before - after) / before * 100).toFixed(1) + '%' : 'measured' }, 'optimization', [type, 'optimization']);
  }
}

// ============ SINGLETON ============

let memoryInstance: HybridMemoryStore | null = null;

export function getMemoryStore(): HybridMemoryStore {
  if (!memoryInstance) {
    memoryInstance = new HybridMemoryStore();
  }
  return memoryInstance;
}
