import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await adminService.getAnalytics({ period, startDate, endDate });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics data' },
      { status: 500 }
    );
  }
}
