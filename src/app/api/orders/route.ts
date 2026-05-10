import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orderRepository } from '@/lib/repositories';
import { requireAuth, authErrorResponse } from '@/lib/middleware';

// ========== ALL ORDERS ARE FREE - AUTO APPROVED ==========

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;

    const orders = await orderRepository.findByUserId(auth.user!.userId, { status, type });

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        type: o.type,
        description: o.description,
        amount: 0, // Always show 0 - everything is free
        status: 'paid',
        paymentStatus: 'paid',
        domainName: o.domainName,
        tld: o.tld,
        years: o.years,
        isFreeDomain: true,
        hostingPlanSlug: o.hostingPlanSlug,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('List orders error:', error);
    return NextResponse.json(
      { error: 'Failed to list orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { domainName, tld, years = 1, type = 'domain_registration' } = body;

    if (!domainName) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      );
    }

    // Create order as FREE and auto-approve
    const order = await orderRepository.create({
      data: {
        userId: auth.user!.userId,
        type,
        description: `FREE: ${domainName} for ${years} year(s)`,
        amount: 0,
        status: 'paid',
        paymentStatus: 'paid',
        domainName,
        tld: tld || '.com',
        years,
        isFreeDomain: true,
        verifiedAt: new Date(),
        items: JSON.stringify({
          domainName,
          tld: tld || '.com',
          years,
          pricePerYear: 0,
          totalPrice: 0,
          free: true,
        }),
      },
    });

    return NextResponse.json({
      message: 'Order created and approved - FREE!',
      order: {
        id: order.id,
        type: order.type,
        description: order.description,
        amount: 0,
        status: 'paid',
        paymentStatus: 'paid',
        domainName: order.domainName,
        tld: order.tld,
        years: order.years,
        free: true,
        createdAt: order.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
