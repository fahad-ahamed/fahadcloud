import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getHostingEngine } from '@/lib/hosting-engine';

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

    // === FIX: Create HostingEnvironment record linked to the domain ===
    const rootPath = `/home/fahad/hosting/users/${userId}/${domainName}`;

    // Check if hosting env already exists for this domain
    let hostingEnv = domain.hostingEnvId
      ? await prisma.hostingEnvironment.findUnique({ where: { id: domain.hostingEnvId } })
      : null;

    if (!hostingEnv) {
      // Try to use the Docker-based hosting engine
      let dockerContainerId: string | null = null;
      let dockerStatus: string | null = null;
      let buildLogMsg = '';

      try {
        const hostingEngine = getHostingEngine();
        if (hostingEngine.isDockerAvailable()) {
          const deployResult = await hostingEngine.createHostingEnv(userId, domainName, framework);
          if (deployResult.success) {
            dockerContainerId = deployResult.containerId || null;
            dockerStatus = 'running';
            buildLogMsg = deployResult.buildLog || '';
          } else {
            buildLogMsg = deployResult.error || 'Docker deploy failed, using simulated env';
          }
        }
      } catch (e: any) {
        buildLogMsg = `Docker error: ${e.message}`;
      }

      // Ensure the directory exists on disk
      try {
        const fs = require('fs');
        fs.mkdirSync(rootPath, { recursive: true });
        // Write a default index.html if none exists
        const indexPath = `${rootPath}/index.html`;
        if (!fs.existsSync(indexPath)) {
          fs.writeFileSync(indexPath, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${domainName}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: white; text-align: center; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 2rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div>
    <h1>Site Deployed!</h1>
    <p>Your ${framework} app on <strong>${domainName}</strong> is live.</p>
    <div class="badge">Powered by FahadCloud</div>
  </div>
</body>
</html>`);
        }
      } catch {}

      // Create HostingEnvironment in database
      hostingEnv = await prisma.hostingEnvironment.create({
        data: {
          userId,
          domainId: domain.id,
          planSlug: 'starter',
          status: 'active',
          rootPath,
          serverType: framework,
          sslEnabled: false,
          storageUsed: 0,
          storageLimit: 5368709120,
          dockerContainerId,
          dockerStatus: dockerStatus || (buildLogMsg ? 'simulated' : 'active'),
          deployLog: buildLogMsg || 'Hosting environment created',
          lastDeployedAt: new Date(),
        },
      });

      // Update the Domain record to link to the new HostingEnvironment
      await prisma.domain.update({
        where: { id: domain.id },
        data: { hostingEnvId: hostingEnv.id },
      });

      // Update the deployment log with the hosting env id
      await prisma.deploymentLog.update({
        where: { id: deployLog.id },
        data: {
          hostingEnvId: hostingEnv.id,
          status: 'deploying',
          deployLog: buildLogMsg || 'Hosting environment created and linked to domain',
        },
      });
    } else {
      // Hosting env already exists - update it
      await prisma.hostingEnvironment.update({
        where: { id: hostingEnv.id },
        data: {
          serverType: framework,
          status: 'active',
          lastDeployedAt: new Date(),
          deployLog: `Redeployed ${framework} at ${new Date().toISOString()}`,
        },
      });

      await prisma.deploymentLog.update({
        where: { id: deployLog.id },
        data: {
          hostingEnvId: hostingEnv.id,
          status: 'deploying',
          deployLog: `Redeploying to existing hosting environment`,
        },
      });
    }

    // Now run the one-click deploy from core
    const { oneClickDeploy } = await import('@/lib/agent/core');
    const result = await oneClickDeploy(userId, domainName, framework, deploySessionId);

    // Mark deployment as live
    await prisma.deploymentLog.update({
      where: { id: deployLog.id },
      data: { status: 'live' },
    });

    return NextResponse.json({
      ...result,
      deployLogId: deployLog.id,
      sessionId: deploySessionId,
      hostingEnvId: hostingEnv?.id,
    });
  } catch (error: any) {
    console.error('Deploy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
