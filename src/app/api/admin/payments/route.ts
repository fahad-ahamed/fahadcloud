import { NextRequest, NextResponse } from 'next/server';
import { paymentRepository } from '@/lib/repositories';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const [result, stats] = await Promise.all([
      paymentRepository.searchPayments({ status, search, userId, page, limit }),
      paymentRepository.getPaymentStats({
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {}),
      }),
    ]);

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
        verifiedBy: p.verifiedBy,
        rejectionReason: p.rejectionReason,
        isDuplicate: p.isDuplicate,
        duplicateOfId: p.duplicateOfId,
        fraudScore: p.fraudScore,
        fraudFlags: p.fraudFlags ? JSON.parse(p.fraudFlags) : [],
        ipAddress: p.ipAddress,
        createdAt: p.createdAt,
        user: p.user,
        order: p.order,
      })),
      pagination: result.pagination,
      stats: {
        totalAmount: stats.totalAmount,
        totalCount: stats.totalCount,
        paidAmount: stats.paidAmount,
        paidCount: stats.paidCount,
        pendingCount: stats.pendingCount,
        rejectedCount: stats.rejectedCount,
        fraudCount: stats.fraudCount,
      },
    });
  } catch (error: any) {
    console.error('Admin payments error:', error);
    return NextResponse.json(
      { error: 'Failed to get payments' },
      { status: 500 }
    );
  }
}
