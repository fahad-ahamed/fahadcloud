import { NextRequest, NextResponse } from 'next/server';
import { getLearningEngine } from '@/lib/agent/learning';
import { getMemoryStore } from '@/lib/agent/memory';

// GET /api/agent/learning - Get predictions and learning data
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const learning = getLearningEngine();
    const memory = getMemoryStore();

    const [predictions, crossInsights, optimizationStrategy] = await Promise.all([
      learning.predictFailure(userId),
      learning.crossProjectInsights(userId),
      learning.generateOptimizationStrategy(userId),
    ]);

    const memoryContext = await memory.augmentWithContext(userId, 'system overview');

    return NextResponse.json({
      predictions,
      crossInsights,
      optimizationStrategy,
      memoryInsights: memoryContext,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

