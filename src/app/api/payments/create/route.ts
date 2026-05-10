import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, getClientIp, authErrorResponse } from '@/lib/middleware';

// ========== ALL PAYMENTS ARE FREE - AUTO APPROVED ==========

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.order.findFirst({ where: { id: orderId, userId: auth.user!.userId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.paymentStatus === 'paid') return NextResponse.json({ message: 'Order is already paid - FREE!', free: true });

    // Auto-approve payment - everything is free
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'paid', status: 'paid', verifiedAt: new Date(), amount: 0 },
    });

    await db.payment.upsert({
      where: { orderId: order.id },
      update: { status: 'paid', verifiedAt: new Date(), verifiedAmount: 0, amount: 0 },
      create: {
        orderId: order.id,
        userId: auth.user!.userId,
        amount: 0,
        currency: 'BDT',
        paymentMethod: 'free',
        status: 'paid',
        verifiedAt: new Date(),
        verifiedAmount: 0,
        paymentTime: new Date(),
        ipAddress: getClientIp(request),
      },
    });

    return NextResponse.json({
      message: 'Payment approved automatically - Everything is FREE!',
      free: true,
      order: { id: order.id, status: 'paid', paymentStatus: 'paid', amount: 0 },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
