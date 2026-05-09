import { NextRequest, NextResponse } from 'next/server';
import { getLearningEngine } from '@/lib/agent/learning';
import { getAutoLearningEngine } from '@/lib/agent/auto-learning';
import { getMemoryStore } from '@/lib/agent/memory';

// GET /api/agent/learning - Get predictions, learning data, and auto-learning stats
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const learning = getLearningEngine();
    const autoLearning = getAutoLearningEngine();
    const memory = getMemoryStore();

    const [predictions, crossInsights, optimizationStrategy, autoLearningStats, knowledgeGraph, autoInsights] = await Promise.all([
      learning.predictFailure(userId),
      learning.crossProjectInsights(userId),
      learning.generateOptimizationStrategy(userId),
      Promise.resolve(autoLearning.getStats()),
      Promise.resolve(autoLearning.getKnowledgeGraph()),
      Promise.resolve(autoLearning.getInsights()),
    ]);

    const memoryContext = await memory.augmentWithContext(userId, 'system overview');

    return NextResponse.json({
      predictions,
      crossInsights,
      optimizationStrategy,
      memoryInsights: memoryContext,
      autoLearning: {
        stats: autoLearningStats,
        knowledgeGraph,
        insights: autoInsights.slice(0, 20),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/learning - Trigger a learning cycle
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fahadcloud-secret-key-2024-secure-prod-v2');
    try { await jwtVerify(token, secret); } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const autoLearning = getAutoLearningEngine();
    const result = await autoLearning.runLearningCycle();

    return NextResponse.json({
      message: 'Auto Learning cycle completed',
      result,
      stats: autoLearning.getStats(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
