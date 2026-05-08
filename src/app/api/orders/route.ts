import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orderRepository } from '@/lib/repositories';
import { requireAuth, authErrorResponse } from '@/lib/middleware';

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
        amount: o.amount,
        status: o.status,
        paymentStatus: o.paymentStatus,
        domainName: o.domainName,
        tld: o.tld,
        years: o.years,
        isFreeDomain: o.isFreeDomain,
        hostingPlanSlug: o.hostingPlanSlug,
        bKashNumber: o.bKashNumber,
        bKashTrxId: o.bKashTrxId,
        domain: o.domain,
        payment: o.payment,
        adminNotes: o.adminNotes,
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

    // Check pricing
    const tldPricing = await db.tldPricing.findUnique({ where: { tld: tld || '.com' } });
    if (!tldPricing) {
      return NextResponse.json(
        { error: `Pricing not available for ${tld || '.com'}` },
        { status: 400 }
      );
    }

    const registerPrice = tldPricing.promo && tldPricing.promoPrice 
      ? tldPricing.promoPrice 
      : tldPricing.registerPrice;
    const totalPrice = registerPrice * years;

    // Convert to BDT
    const amountBDT = Math.round(totalPrice * 110 * 100) / 100;

    const order = await orderRepository.create({
      data: {
        userId: auth.user!.userId,
        type,
        description: `Domain registration: ${domainName} for ${years} year(s)`,
        amount: amountBDT,
        status: 'pending',
        paymentStatus: 'unpaid',
        domainName,
        tld: tld || '.com',
        years,
        isFreeDomain: false,
        items: JSON.stringify({
          domainName,
          tld: tld || '.com',
          years,
          pricePerYear: registerPrice,
          totalPrice,
          amountBDT,
        }),
      },
    });

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        type: order.type,
        description: order.description,
        amount: order.amount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        domainName: order.domainName,
        tld: order.tld,
        years: order.years,
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
