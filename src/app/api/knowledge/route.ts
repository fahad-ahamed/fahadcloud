// ============ KNOWLEDGE SEARCH API ============
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { persistentMemory } from '@/lib/agent/memory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const domain = searchParams.get('domain');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      const where: any = {};
      if (domain) where.domain = domain;
      if (userId) where.userId = userId;
      const entries = await db.knowledgeEntry.findMany({ where, orderBy: { confidence: 'desc' }, take: limit });
      return NextResponse.json({ entries });
    }

    const results = await persistentMemory.searchKnowledge(query, domain || undefined, limit);
    const memoryResults = userId ? await persistentMemory.semanticSearch(userId, query, { limit: 5 }) : [];

    return NextResponse.json({ query, knowledgeResults: results, memoryResults });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, domain, topic, content, summary, source, tags } = await request.json();
    if (!domain || !topic || !content) return NextResponse.json({ error: 'domain, topic, and content are required' }, { status: 400 });

    const id = await persistentMemory.storeKnowledge(domain, topic, content, summary || content.substring(0, 200), source || 'manual', userId, tags || []);
    return NextResponse.json({ id, message: 'Knowledge stored successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
