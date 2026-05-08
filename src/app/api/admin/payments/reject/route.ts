import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services';
import { requireAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { paymentId, reason } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const result = await paymentService.rejectPayment(paymentId, auth.user!.userId, reason, ip);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Reject payment error:', error);
    return NextResponse.json(
      { error: 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
