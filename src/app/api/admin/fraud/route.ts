import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentRepository } from '@/lib/repositories';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    // Get suspicious payments - use paymentRepository.findMany with custom where
    const suspiciousPayments = await paymentRepository.findMany({
      where: { fraudScore: { gte: 30 }, status: { in: ['pending', 'verifying'] } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: { select: { id: true, domainName: true, type: true, amount: true } },
      },
      orderBy: { fraudScore: 'desc' },
      take: 50,
    });

    // Get duplicate TRX ID payments
    const duplicatePayments = await paymentRepository.findMany({
      where: { isDuplicate: true },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get rejected payments
    const rejectedPayments = await paymentRepository.findMany({
      where: { status: 'rejected' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: { select: { id: true, domainName: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Users with multiple failed attempts - use db directly for groupBy
    const usersWithFailures = await db.payment.groupBy({
      by: ['userId'],
      where: { status: 'rejected' },
      _count: { userId: true },
      having: { userId: { _count: { gt: 2 } } },
      orderBy: { _count: { userId: 'desc' } },
      take: 20,
    });

    const flaggedUserIds = usersWithFailures.map(u => u.userId);
    const flaggedUsers = flaggedUserIds.length > 0
      ? await db.user.findMany({ where: { id: { in: flaggedUserIds } }, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } })
      : [];

    return NextResponse.json({
      suspiciousPayments,
      duplicatePayments,
      rejectedPayments,
      flaggedUsers: flaggedUsers.map(u => ({
        ...u,
        failedAttempts: usersWithFailures.find(f => f.userId === u.id)?._count.userId || 0,
      })),
      summary: {
        totalSuspicious: suspiciousPayments.length,
        totalDuplicates: duplicatePayments.length,
        totalRejected: rejectedPayments.length,
        flaggedUserCount: flaggedUsers.length,
      },
    });
  } catch (error: any) {
    console.error('Fraud monitoring error:', error);
    return NextResponse.json({ error: 'Failed to get fraud monitoring data' }, { status: 500 });
  }
}
