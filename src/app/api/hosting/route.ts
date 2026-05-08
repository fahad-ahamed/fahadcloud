import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { usdToBdt } from '@/lib/bkash';

export async function GET() {
  try {
    const plans = await db.hostingPlan.findMany({
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('List hosting plans error:', error);
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
    const { planSlug, domainName, billingCycle = 'monthly' } = body;

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
