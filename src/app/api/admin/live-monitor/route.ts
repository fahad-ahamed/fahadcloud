import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

// GET /api/admin/live-monitor - Live user activity monitoring
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all'; // all, terminal, ai, domains, hosting, payments, auth
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const hours = parseInt(searchParams.get('hours') || '24');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const where: any = {
      createdAt: { gte: since },
    };

    if (userId) where.userId = userId;
    if (filter !== 'all') where.category = filter;

    // Get activity logs with user info
    const activities = await db.userActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get user details for the activities
    const userIds = [...new Set(activities.map(a => a.userId))];
    const users = userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true, loginIp: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedActivities = activities.map(a => ({
      ...a,
      user: userMap.get(a.userId) || null,
    }));

    // Get online users (active in last 15 minutes)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineUsers = await db.userActivityLog.findMany({
      where: { createdAt: { gte: fifteenMinAgo } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const onlineUserIds = onlineUsers.map(o => o.userId);
    const onlineUsersDetails = onlineUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: onlineUserIds } },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true, loginIp: true },
        })
      : [];

    // Get activity counts by category
    const categoryCounts = await db.userActivityLog.groupBy({
      by: ['category'],
      where: { createdAt: { gte: since } },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    // Get activity counts by action (top 10)
    const actionCounts = await db.userActivityLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    });

    // Get most active users (top 10)
    const mostActiveUsers = await db.userActivityLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    const mostActiveUserIds = mostActiveUsers.map(m => m.userId);
    const mostActiveUsersDetails = mostActiveUserIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: mostActiveUserIds } },
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        })
      : [];

    const mostActiveMap = new Map(mostActiveUsersDetails.map(u => [u.id, u]));

    return NextResponse.json({
      activities: enrichedActivities,
      onlineUsers: onlineUsersDetails,
      stats: {
        totalActivities: activities.length,
        onlineCount: onlineUsersDetails.length,
        categoryCounts: categoryCounts.map(c => ({ category: c.category, count: c._count.category })),
        actionCounts: actionCounts.map(a => ({ action: a.action, count: a._count.action })),
        mostActiveUsers: mostActiveUsers.map(m => ({
          user: mostActiveMap.get(m.userId) || { id: m.userId },
          activityCount: m._count.userId,
        })),
      },
    });
  } catch (error: any) {
    console.error('Admin live monitor error:', error);
    return NextResponse.json({ error: 'Failed to get monitoring data' }, { status: 500 });
  }
}
