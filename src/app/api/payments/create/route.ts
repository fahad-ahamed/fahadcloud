import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services';
import { requireAuth, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { orderId, trxId, senderNumber } = body;

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await paymentService.createPayment(
      auth.user!.userId,
      { orderId, trxId, senderNumber },
      ip,
      userAgent
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    // paymentService returns status as a property, extract it
    const { status: _statusCode, ...responseData } = result;
    return NextResponse.json(responseData, { status: result.status || 201 });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
