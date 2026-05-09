import { NextRequest, NextResponse } from 'next/server';
import { adminLogRepository } from '@/lib/repositories';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || undefined;
    const adminId = searchParams.get('adminId') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const targetId = searchParams.get('targetId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await adminLogRepository.searchLogs({
      action, adminId, targetType, targetId, startDate, endDate, page, limit,
    });

    return NextResponse.json({
      logs: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Admin logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get admin logs' },
      { status: 500 }
    );
  }
}
