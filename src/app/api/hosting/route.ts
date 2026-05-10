import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// ========== ALL HOSTING IS FREE - FAHADCLOUD ==========

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
        const payload = (await jwtVerify(token, secret)).payload;
        userId = payload.userId as string;
      } catch {}
    }

    if (!userId) {
      const currentUser = await getCurrentUser();
      if (currentUser) userId = currentUser.userId;
    }

    const plans = await db.hostingPlan.findMany({
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });

    let environments: any[] = [];
    if (userId) {
      environments = await db.hostingEnvironment.findMany({
        where: { userId },
        include: { domain: { select: { name: true, sslEnabled: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ plans, environments });
  } catch (error: any) {
    console.error('List hosting error:', error);
    return NextResponse.json(
      { error: 'Failed to list hosting plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { planSlug, domainName, billingCycle = 'monthly', action, envId } = body;

    // Handle hosting environment actions
    if (action && envId) {
      const env = await db.hostingEnvironment.findFirst({
        where: { id: envId, userId: currentUser.userId },
      });
      if (!env) {
        return NextResponse.json({ error: 'Hosting environment not found' }, { status: 404 });
      }

      switch (action) {
        case 'restart':
          await db.hostingEnvironment.update({
            where: { id: envId },
            data: { status: 'active', lastDeployedAt: new Date(), deployLog: `Restarted at ${new Date().toISOString()}` },
          });
          return NextResponse.json({ message: 'Hosting environment restarted', envId });

        case 'stop':
          await db.hostingEnvironment.update({
            where: { id: envId },
            data: { status: 'stopped', deployLog: `Stopped at ${new Date().toISOString()}` },
          });
          return NextResponse.json({ message: 'Hosting environment stopped', envId });

        case 'start':
          await db.hostingEnvironment.update({
            where: { id: envId },
            data: { status: 'active', lastDeployedAt: new Date(), deployLog: `Started at ${new Date().toISOString()}` },
          });
          return NextResponse.json({ message: 'Hosting environment started', envId });

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }
    }

    if (!planSlug) {
      return NextResponse.json(
        { error: 'Plan slug is required' },
        { status: 400 }
      );
    }

    const plan = await db.hostingPlan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json(
        { error: 'Hosting plan not found' },
        { status: 404 }
      );
    }

    // ALL HOSTING IS FREE - auto-create environment with unlimited storage
    if (domainName) {
      const domain = await db.domain.findFirst({
        where: { name: domainName, userId: currentUser.userId },
      });
      if (!domain) {
        return NextResponse.json(
          { error: 'Domain not found or does not belong to you' },
          { status: 404 }
        );
      }

      // Check if hosting env already exists for this domain
      const existingEnv = await db.hostingEnvironment.findUnique({
        where: { domainId: domain.id },
      });

      if (existingEnv) {
        // Update to the new plan
        await db.hostingEnvironment.update({
          where: { id: existingEnv.id },
          data: {
            planSlug: planSlug,
            storageLimit: 107374182400, // 100GB FREE
            status: 'active',
          },
        });

        return NextResponse.json({
          message: 'Hosting plan upgraded for FREE!',
          environment: { id: existingEnv.id, planSlug, status: 'active' },
          free: true,
        });
      }

      // Create new hosting environment
      const env = await db.hostingEnvironment.create({
        data: {
          userId: currentUser.userId,
          domainId: domain.id,
          planSlug: planSlug,
          status: 'active',
          rootPath: `/home/fahad/hosting/users/${currentUser.userId}/${domainName}`,
          serverType: 'static',
          sslEnabled: false,
          storageUsed: 0,
          storageLimit: 107374182400, // 100GB FREE
        },
      });

      // Create hosting directory
      try {
        const fs = require('fs');
        const hostDir = `/home/fahad/hosting/users/${currentUser.userId}/${domainName}`;
        fs.mkdirSync(hostDir, { recursive: true });
        if (!fs.existsSync(hostDir + '/index.html')) {
          fs.writeFileSync(hostDir + '/index.html', '<!DOCTYPE html><html><head><title>' + domainName + '</title></head><body><h1>Welcome to ' + domainName + '</h1><p>Powered by FahadCloud - 100% FREE</p></body></html>');
        }
      } catch (e: any) {
        console.error('Hosting dir error:', e.message);
      }

      await db.notification.create({
        data: {
          userId: currentUser.userId,
          title: 'Hosting Activated - FREE!',
          message: `Your ${plan.name} hosting for ${domainName} is now active with 100GB storage - completely FREE!`,
          type: 'success',
        },
      });

      return NextResponse.json({
        message: 'Hosting activated for FREE!',
        environment: { id: env.id, planSlug, status: 'active' },
        free: true,
      }, { status: 201 });
    }

    // No domain - just confirm plan selection
    return NextResponse.json({
      message: 'Plan selected! Connect a domain to activate hosting.',
      plan: { slug: planSlug, name: plan.name },
      free: true,
    });
  } catch (error: any) {
    console.error('Hosting subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to hosting plan' },
      { status: 500 }
    );
  }
}
