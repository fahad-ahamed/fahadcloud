import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const data = await adminService.getDashboardData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to get admin dashboard data' },
      { status: 500 }
    );
  }
}
