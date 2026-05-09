import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { usdToBdt } from '@/lib/bkash';

export async function GET(request: NextRequest) {
  try {
    // Try JWT auth first
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

    // Fallback to session auth
    if (!userId) {
      const currentUser = await getCurrentUser();
      if (currentUser) userId = currentUser.userId;
    }

    const plans = await db.hostingPlan.findMany({
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });

    // Get user's hosting environments if authenticated
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

    // Determine price based on billing cycle
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
    const priceBDT = usdToBdt(price);

    // If domainName is provided, verify it belongs to the user
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
    }

    const order = await db.order.create({
      data: {
        userId: currentUser.userId,
        type: 'hosting',
        description: `Hosting plan: ${plan.name} (${billingCycle})${domainName ? ` for ${domainName}` : ''}`,
        amount: priceBDT,
        status: 'pending',
        paymentStatus: 'unpaid',
        domainName: domainName || null,
        hostingPlanSlug: planSlug,
        isFreeDomain: false,
        items: JSON.stringify({
          planSlug,
          planName: plan.name,
          billingCycle,
          priceUSD: price,
          priceBDT,
          domainName: domainName || null,
          storage: plan.storage,
          bandwidth: plan.bandwidth,
          websites: plan.websites,
        }),
      },
    });

    return NextResponse.json({
      message: 'Hosting subscription order created',
      order: {
        id: order.id,
        amount: order.amount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        description: order.description,
        createdAt: order.createdAt,
      },
      pricing: {
        planName: plan.name,
        billingCycle,
        priceUSD: price,
        priceBDT,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Hosting subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to hosting plan' },
      { status: 500 }
    );
  }
}
