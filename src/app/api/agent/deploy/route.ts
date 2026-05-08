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

    // Supported frameworks
    const frameworks = [
      { id: 'static', name: 'Static HTML/CSS', icon: 'html', buildCmd: '', startCmd: 'npx serve -s .', port: 3000 },
      { id: 'react', name: 'React', icon: 'react', buildCmd: 'npm run build', startCmd: 'npx serve -s build', port: 3000 },
      { id: 'nextjs', name: 'Next.js', icon: 'nextjs', buildCmd: 'npm run build', startCmd: 'npm start', port: 3000 },
      { id: 'vue', name: 'Vue.js', icon: 'vue', buildCmd: 'npm run build', startCmd: 'npx serve -s dist', port: 3000 },
      { id: 'nodejs', name: 'Node.js', icon: 'nodejs', buildCmd: 'npm run build', startCmd: 'npm start', port: 3000 },
      { id: 'express', name: 'Express', icon: 'express', buildCmd: '', startCmd: 'npm start', port: 3000 },
      { id: 'php', name: 'PHP', icon: 'php', buildCmd: '', startCmd: 'php -S 0.0.0.0:8080', port: 8080 },
      { id: 'laravel', name: 'Laravel', icon: 'laravel', buildCmd: '', startCmd: 'php artisan serve --host=0.0.0.0 --port=8080', port: 8080 },
      { id: 'wordpress', name: 'WordPress', icon: 'wordpress', buildCmd: '', startCmd: 'php -S 0.0.0.0:8080', port: 8080 },
      { id: 'python', name: 'Python', icon: 'python', buildCmd: '', startCmd: 'python app.py', port: 5000 },
    ];

    return NextResponse.json({ domains, deployments, frameworks });
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

    const { oneClickDeploy } = await import('@/lib/agent/core');
    const result = await oneClickDeploy(userId, domainName, framework, sessionId || 'deploy');

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


