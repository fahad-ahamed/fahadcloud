import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requireSuperAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

// GET /api/admin/user-detail?userId=xxx - Get detailed user info
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, company: true,
        phone: true, address: true, city: true, country: true, avatar: true,
        role: true, adminRole: true, balance: true, storageLimit: true,
        storageUsed: true, twoFactorEnabled: true, emailVerified: true,
        lastLoginAt: true, loginIp: true, createdAt: true, updatedAt: true,
        _count: { select: { domains: true, orders: true, payments: true, files: true, hostingEnvs: true, databases: true, agentSessions: true, agentMemories: true } },
        domains: { select: { id: true, name: true, tld: true, status: true, sslEnabled: true, registeredAt: true, expiresAt: true } },
        orders: { select: { id: true, type: true, description: true, amount: true, status: true, paymentStatus: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        payments: { select: { id: true, amount: true, status: true, trxId: true, paymentMethod: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        hostingEnvs: { select: { id: true, planSlug: true, status: true, serverType: true, rootPath: true, createdAt: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent activity logs for this user
    const recentActivity = await db.userActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get agent sessions for this user
    const agentSessions = await db.agentSession.findMany({
      where: { userId },
      select: { id: true, title: true, status: true, createdAt: true, _count: { select: { messages: true, tasks: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      user,
      recentActivity,
      agentSessions,
    });
  } catch (error: any) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: 'Failed to get user details' }, { status: 500 });
  }
}
