import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, getClientIp, authErrorResponse } from '@/lib/middleware';

// ========== ALL PAYMENTS VERIFIED INSTANTLY - FREE ==========

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { paymentId, orderId } = body;

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: 'Payment ID or Order ID is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (paymentId) where.id = paymentId;
    if (orderId) where.orderId = orderId;

    const payment = await db.payment.findFirst({
      where,
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Already paid or auto-approve now
    if (payment.status !== 'paid') {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'paid', verifiedAt: new Date(), verifiedAmount: 0, amount: 0 },
      });
      if (payment.order) {
        await db.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'paid', status: 'paid', verifiedAt: new Date(), amount: 0 },
        });
      }
    }

    return NextResponse.json({
      message: 'Payment verified - Everything is FREE!',
      verified: true,
      free: true,
      payment: {
        id: payment.id,
        status: 'paid',
        amount: 0,
        verifiedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    return NextResponse.json({
      message: 'All payments are automatically verified - Everything is FREE!',
      results: [],
      free: true,
    });
  } catch (error: any) {
    console.error('Auto-verify error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-verify payments' },
      { status: 500 }
    );
  }
}
