import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services';
import { requireAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { paymentId, adminNotes } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const result = await paymentService.approvePayment(paymentId, auth.user!.userId, adminNotes, ip);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Approve payment error:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
