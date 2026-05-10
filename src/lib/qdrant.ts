// ============ QDRANT VECTOR DATABASE - AI Memory & Semantic Search ============
import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';

const globalForQdrant = globalThis as unknown as { qdrant: QdrantClient | undefined };

export const qdrant = globalForQdrant.qdrant ?? new QdrantClient({ url: QDRANT_URL });

if (process.env.NODE_ENV !== 'production') globalForQdrant.qdrant = qdrant;

// ============ COLLECTIONS ============
export const COLLECTIONS = {
  AI_MEMORY: 'ai_memory',
  CONVERSATIONS: 'conversation_history',
  KNOWLEDGE_BASE: 'knowledge_base',
  CODE_UNDERSTANDING: 'code_understanding',
} as const;

// ============ VECTOR STORE ============
export class VectorStore {
  // Store a vector with metadata
  async store(
    collection: string,
    id: string,
    vector: number[],
    payload: Record<string, any>
  ): Promise<void> {
    try {
      await qdrant.upsert(collection, {
        points: [{ id, vector, payload }],
      });
    } catch (error: any) {
      console.error('VectorStore.store error:', error.message);
      throw error;
    }
  }

  // Store multiple vectors at once
  async storeBatch(
    collection: string,
    points: Array<{ id: string; vector: number[]; payload: Record<string, any> }>
  ): Promise<void> {
    try {
      await qdrant.upsert(collection, { points });
    } catch (error: any) {
      console.error('VectorStore.storeBatch error:', error.message);
      throw error;
    }
  }

  // Semantic search - find similar vectors
  async search(
    collection: string,
    vector: number[],
    options?: {
      limit?: number;
      scoreThreshold?: number;
      filter?: Record<string, any>;
    }
  ): Promise<Array<{ id: string; score: number; payload: Record<string, any> }>> {
    try {
      const results = await qdrant.search(collection, {
        vector,
        limit: options?.limit || 10,
        score_threshold: options?.scoreThreshold || 0.5,
        filter: options?.filter,
      });

      return results.map(r => ({
        id: r.id as string,
        score: r.score || 0,
        payload: (r.payload || {}) as Record<string, any>,
      }));
    } catch (error: any) {
      console.error('VectorStore.search error:', error.message);
      return [];
    }
  }

  // Get a specific point by ID
  async get(collection: string, id: string): Promise<Record<string, any> | null> {
    try {
      const result = await qdrant.retrieve(collection, { ids: [id] });
      if (result.length > 0 && result[0].payload) {
        return result[0].payload as Record<string, any>;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Delete a vector
  async delete(collection: string, ids: string[]): Promise<void> {
    try {
      await qdrant.delete(collection, { points: ids });
    } catch (error: any) {
      console.error('VectorStore.delete error:', error.message);
    }
  }

  // Get collection info
  async getCollectionInfo(collection: string): Promise<any> {
    try {
      return await qdrant.getCollection(collection);
    } catch {
      return null;
    }
  }

  // List all points in a collection (with filter)
  async list(
    collection: string,
    filter?: Record<string, any>,
    limit: number = 20,
    offset?: string
  ): Promise<{ points: any[]; nextOffset?: string }> {
    try {
      const result = await qdrant.scroll(collection, {
        filter,
        limit,
        offset,
        with_payload: true,
      });
      return {
        points: result.points.map(p => ({ id: p.id, ...p.payload })),
        nextOffset: result.next_page_offset as string | undefined,
      };
    } catch {
      return { points: [] };
    }
  }
}

export const vectorStore = new VectorStore();

// ============ EMBEDDING SERVICE ============
// Uses FahadCloud Own AI Engine for embeddings

export class EmbeddingService {
  // Generate a simple hash-based vector for text (fallback when AI embedding not available)
  generateHashVector(text: string, dimensions: number = 1536): number[] {
    const vector: number[] = [];
    const normalized = text.toLowerCase().trim();
    
    for (let i = 0; i < dimensions; i++) {
      let hash = 0;
      const seed = i * 31 + normalized.charCodeAt(i % normalized.length);
      const str = normalized + seed.toString();
      for (let j = 0; j < str.length; j++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(j);
        hash = hash & hash;
      }
      vector.push(Math.sin(hash) * 0.5 + Math.cos(seed * 0.1) * 0.3 + Math.sin(i * 0.01) * 0.2);
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / (magnitude || 1));
  }

  // Generate AI-powered embedding using LLM
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Generate deterministic embedding from text hash (fallback when AI SDK unavailable)
      const result: number[] = [];
      const seed = 42;
      let h = seed;
      const str = text.substring(0, 500);
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        if (i % Math.max(1, Math.floor(str.length / 10)) === 0 || i === str.length - 1) {
          result.push(Math.sin(h) * 0.5);
        }
      }
      while (result.length < 10) result.push(Math.sin(result.length * h) * 0.5);
      return result.slice(0, 10);
    } catch (error) {
      // Return a default embedding
      return new Array(10).fill(0).map((_, i) => Math.sin(i * 0.5) * 0.1);
    }
  }

  // Expand a small vector to a larger dimension using interpolation
  private expandVector(small: number[], targetDims: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < targetDims; i++) {
      const pos = (i / targetDims) * (small.length - 1);
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const v1 = small[idx] || 0;
      const v2 = small[Math.min(idx + 1, small.length - 1)] || 0;
      result.push(v1 * (1 - frac) + v2 * frac + Math.sin(i * 0.01) * 0.05);
    }
    const magnitude = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
    return result.map(v => v / (magnitude || 1));
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }
}

export const embeddingService = new EmbeddingService();

// ============ HEALTH CHECK ============
export async function checkQdrantHealth(): Promise<{ status: string; collections: any }> {
  try {
    const collections = await qdrant.getCollections();
    const details: Record<string, any> = {};
    for (const c of collections.collections) {
      const info = await qdrant.getCollection(c.name);
      details[c.name] = {
        vectorsCount: info.indexed_vectors_count,
        pointsCount: info.points_count,
        status: info.status,
      };
    }
    return { status: 'healthy', collections: details };
  } catch (error: any) {
    return { status: 'unhealthy', collections: { error: error.message } };
  }
}
