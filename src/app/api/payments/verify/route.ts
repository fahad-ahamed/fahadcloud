import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentRepository } from '@/lib/repositories';
import { requireAuth, getClientIp, authErrorResponse } from '@/lib/middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyBkashPayment } from '@/lib/bkash';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, 'payment_verify');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { paymentId, orderId } = body;

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: 'Payment ID or Order ID is required' },
        { status: 400 }
      );
    }

    // Find payment
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

    if (payment.userId !== auth.user!.userId && auth.user!.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (payment.status === 'paid') {
      return NextResponse.json({
        message: 'Payment is already verified and paid',
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          trxId: payment.trxId,
          verifiedAt: payment.verifiedAt,
        },
      });
    }

    if (!payment.trxId) {
      return NextResponse.json(
        { error: 'No TRX ID associated with this payment' },
        { status: 400 }
      );
    }

    // Attempt bKash verification
    const verification = await verifyBkashPayment(
      payment.trxId,
      payment.amount,
      payment.senderNumber || undefined
    );

    // Update payment with verification data
    await db.payment.update({
      where: { id: payment.id },
      data: {
        verificationRaw: JSON.stringify(verification),
        fraudFlags: verification.fraudFlags 
          ? JSON.stringify([...(verification.fraudFlags || []), ...(payment.fraudFlags ? JSON.parse(payment.fraudFlags) : [])])
          : payment.fraudFlags,
      },
    });

    // Log verification attempt
    await paymentRepository.createPaymentLog({
      paymentId: payment.id,
      action: 'verification_attempted',
      details: JSON.stringify({
        valid: verification.valid,
        error: verification.error,
        fraudFlags: verification.fraudFlags,
      }),
      performedBy: auth.user!.userId,
      ipAddress: ip,
    });

    if (verification.valid) {
      // Payment verified successfully
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          verifiedAmount: verification.amount,
          verifiedAt: new Date(),
        },
      });

      await db.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'paid',
          status: 'paid',
          verifiedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Payment verified successfully',
        verified: true,
        payment: {
          id: payment.id,
          status: 'paid',
          amount: payment.amount,
          verifiedAmount: verification.amount,
          trxId: payment.trxId,
          verifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: verification.error || 'Payment verification pending. Admin will review manually.',
      verified: false,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        trxId: payment.trxId,
      },
      verificationError: verification.error,
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

    // Auto-verify pending payments that have TRX IDs
    const pendingPayments = await db.payment.findMany({
      where: {
        userId: auth.user!.userId,
        status: { in: ['pending', 'verifying'] },
        trxId: { not: null },
      },
      include: { order: true },
    });

    const results = [];

    for (const payment of pendingPayments) {
      try {
        const verification = await verifyBkashPayment(
          payment.trxId!,
          payment.amount,
          payment.senderNumber || undefined
        );

        if (verification.valid) {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'paid',
              verifiedAmount: verification.amount,
              verifiedAt: new Date(),
              verificationRaw: JSON.stringify(verification),
            },
          });

          await db.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: 'paid',
              status: 'paid',
              verifiedAt: new Date(),
            },
          });

          results.push({
            paymentId: payment.id,
            trxId: payment.trxId,
            status: 'verified',
            amount: payment.amount,
            verifiedAmount: verification.amount,
          });
        } else {
          results.push({
            paymentId: payment.id,
            trxId: payment.trxId,
            status: payment.status,
            message: verification.error || 'Pending admin verification',
          });
        }
      } catch {
        results.push({
          paymentId: payment.id,
          trxId: payment.trxId,
          status: payment.status,
          message: 'Verification check failed',
        });
      }
    }

    return NextResponse.json({
      message: `Checked ${pendingPayments.length} pending payments`,
      results,
    });
  } catch (error: any) {
    console.error('Auto-verify error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-verify payments' },
      { status: 500 }
    );
  }
}
