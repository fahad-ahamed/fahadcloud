import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/agent/deploy - Get deployment options and status
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;

    // Get user's domains
    const domains = await prisma.domain.findMany({ where: { userId } });
    
    // Get deployment logs
    const deployments = await prisma.deploymentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get hosting environments
    const hostingEnvs = await prisma.hostingEnvironment.findMany({
      where: { userId },
      include: { domain: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Supported frameworks
    const frameworks = [
      { id: 'static', name: 'Static HTML/CSS', icon: 'html', buildCmd: '', startCmd: 'npx serve -s .', port: 3000 },
      { id: 'react', name: 'React v19', icon: 'react', buildCmd: 'npm run build', startCmd: 'npx serve -s build', port: 3000 },
      { id: 'nextjs', name: 'Next.js v15', icon: 'nextjs', buildCmd: 'npm run build', startCmd: 'npm start', port: 3000 },
      { id: 'vue', name: 'Vue.js v3.5', icon: 'vue', buildCmd: 'npm run build', startCmd: 'npx serve -s dist', port: 3000 },
      { id: 'nuxt', name: 'Nuxt v3', icon: 'nuxt', buildCmd: 'npm run build', startCmd: 'node .output/server/index.mjs', port: 3000 },
      { id: 'svelte', name: 'SvelteKit v2', icon: 'svelte', buildCmd: 'npm run build', startCmd: 'node build', port: 3000 },
      { id: 'angular', name: 'Angular v18', icon: 'angular', buildCmd: 'npm run build', startCmd: 'npx serve -s dist/browser', port: 3000 },
      { id: 'nodejs', name: 'Node.js v22', icon: 'nodejs', buildCmd: 'npm run build', startCmd: 'npm start', port: 3000 },
      { id: 'express', name: 'Express v5', icon: 'express', buildCmd: '', startCmd: 'npm start', port: 3000 },
      { id: 'php', name: 'PHP 8.3', icon: 'php', buildCmd: '', startCmd: 'php -S 0.0.0.0:8080', port: 8080 },
      { id: 'laravel', name: 'Laravel v11', icon: 'laravel', buildCmd: '', startCmd: 'php artisan serve --host=0.0.0.0 --port=8080', port: 8080 },
      { id: 'python', name: 'Python 3.12', icon: 'python', buildCmd: '', startCmd: 'python app.py', port: 5000 },
      { id: 'django', name: 'Django v5', icon: 'django', buildCmd: '', startCmd: 'python manage.py runserver 0.0.0.0:5000', port: 5000 },
      { id: 'flask', name: 'Flask v3', icon: 'flask', buildCmd: '', startCmd: 'python app.py', port: 5000 },
      { id: 'wordpress', name: 'WordPress v6.5', icon: 'wordpress', buildCmd: '', startCmd: 'php -S 0.0.0.0:8080', port: 8080 },
      { id: 'astro', name: 'Astro v4', icon: 'astro', buildCmd: 'npm run build', startCmd: 'npx astro preview', port: 3000 },
      { id: 'remix', name: 'Remix v2', icon: 'remix', buildCmd: 'npm run build', startCmd: 'npm start', port: 3000 },
      { id: 'gatsby', name: 'Gatsby v5', icon: 'gatsby', buildCmd: 'npm run build', startCmd: 'npx gatsby serve', port: 3000 },
    ];

    return NextResponse.json({ domains, deployments, hostingEnvs, frameworks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/deploy - Start a deployment
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const body = await request.json();
    const { domainName, framework, sessionId } = body;

    if (!domainName || !framework) {
      return NextResponse.json({ error: 'domainName and framework are required' }, { status: 400 });
    }

    // Verify the domain belongs to the user
    const domain = await prisma.domain.findFirst({
      where: { name: domainName, userId },
    });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found or does not belong to you' }, { status: 404 });
    }

    // Create or get an agent session for deployment
    let deploySessionId = sessionId;
    if (!deploySessionId) {
      const session = await prisma.agentSession.create({
        data: {
          userId,
          title: `Deploy: ${domainName} (${framework})`,
          status: 'active',
          context: JSON.stringify({ domainName, framework }),
        },
      });
      deploySessionId = session.id;
    } else {
      // Verify the session exists
      const existingSession = await prisma.agentSession.findUnique({ where: { id: deploySessionId } });
      if (!existingSession) {
        const session = await prisma.agentSession.create({
          data: {
            userId,
            title: `Deploy: ${domainName} (${framework})`,
            status: 'active',
            context: JSON.stringify({ domainName, framework }),
          },
        });
        deploySessionId = session.id;
      }
    }

    // Create deployment log
    const deployLog = await prisma.deploymentLog.create({
      data: {
        userId,
        hostingEnvId: domain.hostingEnvId,
        domainName,
        framework,
        status: 'pending',
      },
    });

    const { oneClickDeploy } = await import('@/lib/agent/core');
    const result = await oneClickDeploy(userId, domainName, framework, deploySessionId);

    // Update deployment log
    await prisma.deploymentLog.update({
      where: { id: deployLog.id },
      data: { status: 'deploying' },
    });

    return NextResponse.json({
      ...result,
      deployLogId: deployLog.id,
      sessionId: deploySessionId,
    });
  } catch (error: any) {
    console.error('Deploy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
