// ============ AI LEARNING API ============
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, authErrorResponse } from '@/lib/middleware/auth.middleware';

const prisma = new PrismaClient();

// GET /api/agent/learning - List learning sessions with full details
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session with full details
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId },
        include: { 
          resources: { orderBy: { createdAt: 'desc' } },
          insights: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json(session);
    }

    // List all sessions
    const sessions = await prisma.learningSession.findMany({
      where: { userId: auth.user!.userId },
      include: { 
        resources: { take: 3, orderBy: { createdAt: 'desc' } },
        insights: { take: 5, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Learning GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/learning - Start a new learning session
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { topic, depth = 'standard' } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const session = await prisma.learningSession.create({
      data: {
        userId: auth.user!.userId,
        topic: topic.trim(),
        description: `Research topic: ${topic.trim()}`,
        status: 'researching',
        researchDepth: depth,
      },
    });

    // Start learning process in background
    processLearningAsync(session.id, auth.user!.userId, topic.trim(), depth).catch(() => {});

    return NextResponse.json({ session, message: 'Learning session started' });
  } catch (error: any) {
    console.error('Learning POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Background learning processor - generates rich, detailed research
async function processLearningAsync(sessionId: string, userId: string, topic: string, depth: string) {
  try {
    // Update status to researching
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { status: 'researching' },
    });

    // Use AI to research the topic
    const { aiResearch } = await import('@/lib/agent/ai-engine');
    
    const depthInstructions: Record<string, string> = {
      quick: 'Provide a brief overview with 3-5 key points. Keep it concise but informative.',
      standard: 'Provide a comprehensive analysis with 8-12 key points. Include definitions, examples, best practices, and common pitfalls.',
      deep: 'Provide an in-depth research paper with 15+ points. Cover history, current state, future trends, detailed examples, best practices, anti-patterns, tools, resources, and expert recommendations.',
    };

    const result = await aiResearch(topic, depth as 'quick' | 'standard' | 'deep');
    const findings = result.findings || `Research on "${topic}" completed. The topic covers various aspects of ${topic.toLowerCase()}. Key areas include fundamentals, best practices, and practical applications.`;

    // Update status to analyzing
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { status: 'analyzing' },
    });

    // Store as knowledge entry
    const knowledgeEntry = await prisma.knowledgeEntry.create({
      data: {
        userId,
        domain: 'ai_learning',
        topic,
        content: findings,
        summary: findings.substring(0, 300),
        source: 'ai_learning',
        confidence: 0.75,
        tags: JSON.stringify([topic.toLowerCase(), 'ai_research', depth]),
      },
    }).catch(() => null);

    // Create structured insights from the research
    const sections = findings.split(/\n(?=##\s)/);
    const insightCategoryMap: Record<string, string> = {
      'overview': 'concept',
      'key concepts': 'fact',
      'best practices': 'best_practice',
      'common pitfalls': 'warning',
      'practical examples': 'pattern',
      'tools': 'fact',
      'resources': 'fact',
      'summary': 'concept',
    };

    let totalInsights = 0;
    for (const section of sections) {
      const headerMatch = section.match(/^##\s*(.+?)(?:\n|$)/);
      const header = headerMatch ? headerMatch[1].toLowerCase().trim() : 'general';
      const category = Object.entries(insightCategoryMap).find(([k]) => header.includes(k))?.[1] || 'concept';
      
      const lines = section.split('\n').filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('*') || l.trim().startsWith('•') || /^\d+\./.test(l.trim()));
      
      for (const line of lines.slice(0, 5)) {
        const cleanedLine = line.replace(/^[-*•]\s*|^\d+\.\s*/, '').trim();
        if (cleanedLine.length > 10) {
          await prisma.learningInsight.create({
            data: {
              sessionId,
              insight: cleanedLine,
              category,
              confidence: category === 'warning' ? 0.8 : 0.7,
            },
          }).catch(() => {});
          totalInsights++;
        }
      }
    }

    // Also create a resource entry for the research
    await prisma.learningResource.create({
      data: {
        sessionId,
        url: null,
        title: `AI Research: ${topic}`,
        content: findings,
        sourceType: 'ai_analysis',
        relevanceScore: 0.9,
        processed: true,
      },
    }).catch(() => {});

    // Update session as completed with FULL findings
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        findings: findings, // Store the FULL text, not JSON!
        sourcesCount: 1,
        knowledgeStored: totalInsights,
        completedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Learning process error:', error);
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { status: 'failed', error: error.message, completedAt: new Date() },
    }).catch(() => {});
  }
}
