import { NextRequest, NextResponse } from 'next/server';
import { paymentRepository } from '@/lib/repositories';
import { requireAuth, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await paymentRepository.findByUserId(auth.user!.userId, { status, page, limit });

    return NextResponse.json({
      payments: result.items.map(p => ({
        id: p.id,
        orderId: p.orderId,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        trxId: p.trxId,
        senderNumber: p.senderNumber,
        paymentTime: p.paymentTime,
        verifiedAmount: p.verifiedAmount,
        verifiedAt: p.verifiedAt,
        rejectionReason: p.rejectionReason,
        fraudScore: p.fraudScore,
        fraudFlags: p.fraudFlags ? JSON.parse(p.fraudFlags) : [],
        isDuplicate: p.isDuplicate,
        createdAt: p.createdAt,
        order: p.order,
      })),
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Payment history error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment history' },
      { status: 500 }
    );
  }
}
