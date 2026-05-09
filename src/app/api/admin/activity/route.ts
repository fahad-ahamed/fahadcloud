import { NextRequest, NextResponse } from 'next/server';
import { adminLogRepository } from '@/lib/repositories';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const [recentActivity, actionCounts, dailyActivity] = await Promise.all([
      adminLogRepository.getRecentActivity(limit),
      adminLogRepository.getActionCounts(),
      adminLogRepository.getDailyActivity(30),
    ]);

    return NextResponse.json({
      recentActivity,
      actionCounts,
      dailyActivity,
    });
  } catch (error: any) {
    console.error('Admin activity error:', error);
    return NextResponse.json(
      { error: 'Failed to get activity data' },
      { status: 500 }
    );
  }
}
