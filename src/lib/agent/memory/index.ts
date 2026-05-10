// ============ HYBRID MEMORY ARCHITECTURE v4.0 ============
// Real AI-powered semantic search with Qdrant Vector Database
// PostgreSQL for structured data + Qdrant for vector search + Redis for temporary memory

import { db } from '@/lib/db';
import { vectorStore, embeddingService, COLLECTIONS } from '@/lib/qdrant';
import { aiTempMemory, cache } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

// ============ MEMORY TYPES ============
export type MemoryType = 
  | 'short_term' | 'long_term' | 'semantic' 
  | 'workflow' | 'infrastructure' | 'deployment'
  | 'security' | 'performance' | 'error_solution'
  | 'user_preference' | 'project_context' | 'agent_learning'
  | 'optimization_history' | 'knowledge' | 'conversation';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  category: string;
  key: string;
  value: any;
  relevance: number;
  accessCount: number;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt?: Date;
  tags: string[];
  source: string;
  connections: string[];
  embeddingId?: string;
}

export interface MemoryQuery {
  text?: string;
  types?: MemoryType[];
  category?: string;
  key?: string;
  minRelevance?: number;
  limit?: number;
  timeRange?: { from: Date; to: Date };
  useSemanticSearch?: boolean;
}

// ============ PERSISTENT AI MEMORY STORE ============
export class PersistentMemoryStore {
  
  // ============ STORE ============
  async store(
    userId: string,
    type: MemoryType,
    category: string,
    key: string,
    value: any,
    source: string = 'system',
    tags: string[] = [],
    connections: string[] = []
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    
    // Generate embedding for the value
    const textForEmbedding = typeof value === 'string' 
      ? value 
      : `${key} ${category} ${JSON.stringify(value).substring(0, 500)}`;
    
    let embeddingId: string | undefined;
    try {
      const vector = await embeddingService.generateEmbedding(textForEmbedding);
      embeddingId = id;
      
      // Store in Qdrant vector DB
      await vectorStore.store(COLLECTIONS.AI_MEMORY, id, vector, {
        userId,
        type,
        category,
        key,
        tags,
        source,
        createdAt: now.toISOString(),
      });
    } catch (error: any) {
      console.error('Vector store error:', error.message);
    }

    // Store structured data in PostgreSQL
    try {
      const existing = await db.agentMemory.findFirst({ where: { userId, type, key } });
      
      if (existing) {
        await db.agentMemory.update({
          where: { id: existing.id },
          data: {
            value: JSON.stringify({ ...value, _meta: { category, tags, source, connections, embeddingId } }),
            relevance: Math.min(existing.relevance + 0.1, 1.0),
            accessCount: existing.accessCount + 1,
            lastAccessed: now,
          },
        });
        return existing.id;
      } else {
        await db.agentMemory.create({
          data: {
            id,
            userId,
            type,
            key,
            value: JSON.stringify({ ...value, _meta: { category, tags, source, connections, embeddingId } }),
            relevance: 1.0,
          },
        });
        return id;
      }
    } catch (error: any) {
      console.error('PostgreSQL store error:', error.message);
      return id;
    }
  }

  // ============ RECALL (Structured Query) ============
  async recall(userId: string, query: MemoryQuery): Promise<MemoryEntry[]> {
    const where: any = { userId, relevance: { gte: query.minRelevance || 0.3 } };
    if (query.types?.length) where.type = { in: query.types };
    if (query.category) where.key = { contains: query.category };
    if (query.key) where.key = { contains: query.key };
    if (query.timeRange) {
      where.createdAt = { gte: query.timeRange.from, lte: query.timeRange.to };
    }

    try {
      const memories = await db.agentMemory.findMany({
        where,
        orderBy: [{ relevance: 'desc' }, { lastAccessed: 'desc' }],
        take: query.limit || 20,
      });

      // Update access count
      for (const m of memories) {
        await db.agentMemory.update({
          where: { id: m.id },
          data: { accessCount: m.accessCount + 1, lastAccessed: new Date() },
        }).catch(() => {});
      }

      return memories.map(m => {
        const parsed = this.safeParse(m.value);
        return {
          id: m.id,
          type: m.type as MemoryType,
          category: parsed?._meta?.category || '',
          key: m.key,
          value: parsed,
          relevance: m.relevance,
          accessCount: m.accessCount,
          createdAt: m.createdAt,
          lastAccessed: m.lastAccessed,
          expiresAt: m.expiresAt || undefined,
          tags: parsed?._meta?.tags || [],
          source: parsed?._meta?.source || 'system',
          connections: parsed?._meta?.connections || [],
          embeddingId: parsed?._meta?.embeddingId,
        };
      });
    } catch (error: any) {
      console.error('Recall error:', error.message);
      return [];
    }
  }

  // ============ REAL SEMANTIC SEARCH ============
  // Uses Qdrant vector database for true semantic similarity search
  async semanticSearch(
    userId: string,
    textQuery: string,
    options?: { types?: MemoryType[]; limit?: number; minRelevance?: number }
  ): Promise<MemoryEntry[]> {
    try {
      // Generate embedding for the search query
      const queryVector = await embeddingService.generateEmbedding(textQuery);

      // Search in Qdrant vector database
      const filter: any = { must: [{ key: 'userId', match: { value: userId } }] };
      if (options?.types?.length) {
        filter.must.push({ key: 'type', match: { any: options.types } });
      }

      const vectorResults = await vectorStore.search(COLLECTIONS.AI_MEMORY, queryVector, {
        limit: options?.limit || 10,
        scoreThreshold: options?.minRelevance || 0.3,
        filter,
      });

      if (vectorResults.length === 0) {
        // Fallback to database keyword search
        return this.fallbackKeywordSearch(userId, textQuery, options);
      }

      // Enrich vector results with full data from PostgreSQL
      const enriched: MemoryEntry[] = [];
      for (const vr of vectorResults) {
        try {
          const dbEntry = await db.agentMemory.findFirst({ 
            where: { id: vr.id.toString(), userId } 
          });
          
          if (dbEntry) {
            const parsed = this.safeParse(dbEntry.value);
            enriched.push({
              id: dbEntry.id,
              type: dbEntry.type as MemoryType,
              category: parsed?._meta?.category || vr.payload?.category || '',
              key: dbEntry.key,
              value: parsed,
              relevance: vr.score,
              accessCount: dbEntry.accessCount,
              createdAt: dbEntry.createdAt,
              lastAccessed: dbEntry.lastAccessed,
              expiresAt: dbEntry.expiresAt || undefined,
              tags: parsed?._meta?.tags || [],
              source: parsed?._meta?.source || 'semantic_search',
              connections: parsed?._meta?.connections || [],
              embeddingId: vr.id.toString(),
            });
          }
        } catch {}
      }

      return enriched;
    } catch (error: any) {
      console.error('Semantic search error:', error.message);
      return this.fallbackKeywordSearch(userId, textQuery, options);
    }
  }

  // Fallback keyword search when vector search is unavailable
  private async fallbackKeywordSearch(
    userId: string,
    textQuery: string,
    options?: { types?: MemoryType[]; limit?: number; minRelevance?: number }
  ): Promise<MemoryEntry[]> {
    const where: any = { userId };
    if (options?.types?.length) where.type = { in: options.types };
    
    // Search by keyword in key and value
    where.OR = [
      { key: { contains: textQuery, mode: 'insensitive' } },
      { value: { contains: textQuery, mode: 'insensitive' } },
    ];

    try {
      const memories = await db.agentMemory.findMany({
        where,
        orderBy: [{ relevance: 'desc' }, { lastAccessed: 'desc' }],
        take: options?.limit || 10,
      });

      return memories.map(m => {
        const parsed = this.safeParse(m.value);
        return {
          id: m.id,
          type: m.type as MemoryType,
          category: parsed?._meta?.category || '',
          key: m.key,
          value: parsed,
          relevance: m.relevance * 0.7, // Lower relevance for keyword matches
          accessCount: m.accessCount,
          createdAt: m.createdAt,
          lastAccessed: m.lastAccessed,
          expiresAt: m.expiresAt || undefined,
          tags: parsed?._meta?.tags || [],
          source: 'keyword_fallback',
          connections: parsed?._meta?.connections || [],
        };
      });
    } catch {
      return [];
    }
  }

  // ============ STORE CONVERSATION ============
  async storeConversation(
    userId: string,
    sessionId: string,
    role: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Generate embedding for the conversation
      const vector = await embeddingService.generateEmbedding(content);
      
      // Store in Qdrant
      await vectorStore.store(COLLECTIONS.CONVERSATIONS, `${sessionId}:${Date.now()}`, vector, {
        userId,
        sessionId,
        role,
        content: content.substring(0, 1000),
        metadata,
        timestamp: new Date().toISOString(),
      });

      // Also store in PostgreSQL AgentMessage
      const session = await db.agentSession.findFirst({ where: { id: sessionId, userId } });
      if (session) {
        await db.agentMessage.create({
          data: {
            sessionId,
            role,
            content,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
          },
        });
      }
    } catch (error: any) {
      console.error('Store conversation error:', error.message);
    }
  }

  // ============ SEARCH CONVERSATIONS ============
  async searchConversations(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const queryVector = await embeddingService.generateEmbedding(query);
      return vectorStore.search(COLLECTIONS.CONVERSATIONS, queryVector, {
        limit,
        scoreThreshold: 0.4,
        filter: { must: [{ key: 'userId', match: { value: userId } }] },
      });
    } catch {
      return [];
    }
  }

  // ============ STORE KNOWLEDGE ============
  async storeKnowledge(
    domain: string,
    topic: string,
    content: string,
    summary: string,
    source: string = 'ai_learning',
    userId?: string,
    tags: string[] = []
  ): Promise<string> {
    const id = uuidv4();

    try {
      // Generate embedding
      const vector = await embeddingService.generateEmbedding(`${topic} ${summary}`);
      
      // Store in Qdrant
      await vectorStore.store(COLLECTIONS.KNOWLEDGE_BASE, id, vector, {
        domain,
        topic,
        summary,
        source,
        userId,
        tags,
      });

      // Store in PostgreSQL
      await db.knowledgeEntry.create({
        data: {
          id,
          userId,
          domain,
          topic,
          content,
          summary,
          source,
          tags: JSON.stringify(tags),
          embeddingId: id,
        },
      });

      return id;
    } catch (error: any) {
      console.error('Store knowledge error:', error.message);
      return id;
    }
  }

  // ============ SEARCH KNOWLEDGE ============
  async searchKnowledge(
    query: string,
    domain?: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const queryVector = await embeddingService.generateEmbedding(query);
      const filter: any = {};
      if (domain) {
        filter.must = [{ key: 'domain', match: { value: domain } }];
      }

      const vectorResults = await vectorStore.search(COLLECTIONS.KNOWLEDGE_BASE, queryVector, {
        limit,
        scoreThreshold: 0.4,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      });

      // Enrich with PostgreSQL data
      const enriched = [];
      for (const vr of vectorResults) {
        try {
          const dbEntry = await db.knowledgeEntry.findFirst({ where: { embeddingId: vr.id.toString() } });
          enriched.push({
            ...vr.payload,
            score: vr.score,
            fullContent: dbEntry?.content,
            id: dbEntry?.id || vr.id,
          });
        } catch {
          enriched.push({ ...vr.payload, score: vr.score });
        }
      }

      return enriched;
    } catch {
      return [];
    }
  }

  // ============ DELETE ============
  async delete(userId: string, memoryId: string): Promise<boolean> {
    try {
      const memory = await db.agentMemory.findFirst({ where: { id: memoryId, userId } });
      if (!memory) return false;

      // Delete from PostgreSQL
      await db.agentMemory.delete({ where: { id: memoryId } });

      // Delete from Qdrant
      if (memoryId) {
        await vectorStore.delete(COLLECTIONS.AI_MEMORY, [memoryId]).catch(() => {});
      }

      return true;
    } catch {
      return false;
    }
  }

  // ============ MEMORY STATS ============
  async getStats(userId: string): Promise<{
    totalMemories: number;
    byType: Record<string, number>;
    avgRelevance: number;
    recentAccesses: number;
    vectorIndexed: number;
  }> {
    try {
      const [total, byType, recentAccess] = await Promise.all([
        db.agentMemory.count({ where: { userId } }),
        db.agentMemory.groupBy({ by: ['type'], where: { userId }, _count: true }),
        db.agentMemory.count({ where: { userId, lastAccessed: { gte: new Date(Date.now() - 86400000) } } }),
      ]);

      const typeMap: Record<string, number> = {};
      for (const bt of byType) {
        typeMap[bt.type] = bt._count;
      }

      let vectorIndexed = 0;
      try {
        const info = await vectorStore.getCollectionInfo(COLLECTIONS.AI_MEMORY);
        vectorIndexed = info?.points_count || 0;
      } catch {}

      return {
        totalMemories: total,
        byType: typeMap,
        avgRelevance: 0.75,
        recentAccesses: recentAccess,
        vectorIndexed,
      };
    } catch {
      return { totalMemories: 0, byType: {}, avgRelevance: 0, recentAccesses: 0, vectorIndexed: 0 };
    }
  }

  private safeParse(value: string | null | undefined): any {
    if (!value) return {};
    try { return JSON.parse(value); } catch { return {}; }
  }
}

// ============ SINGLETON ============
export const persistentMemory = new PersistentMemoryStore();
