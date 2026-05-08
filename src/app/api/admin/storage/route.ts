import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          storageLimit: true,
          storageUsed: true,
          createdAt: true,
          _count: {
            select: {
              files: true,
              hostingEnvs: true,
            },
          },
          files: {
            select: { size: true, mimeType: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          hostingEnvs: {
            select: {
              id: true,
              planSlug: true,
              status: true,
              storageUsed: true,
              storageLimit: true,
              domain: { select: { name: true } },
            },
          },
        },
        orderBy: { storageUsed: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // Get overall storage stats
    const storageStats = await db.user.aggregate({
      _sum: { storageUsed: true, storageLimit: true },
      _avg: { storageUsed: true },
    });

    // Get total files count
    const totalFiles = await db.fileEntry.count();
    const totalFileSize = await db.fileEntry.aggregate({ _sum: { size: true } });

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        storageLimit: u.storageLimit,
        storageUsed: u.storageUsed,
        storagePercentage: u.storageLimit > 0 ? Math.round((u.storageUsed / u.storageLimit) * 100) : 0,
        storageLimitGB: Math.round(u.storageLimit / 1073741824 * 100) / 100,
        storageUsedGB: Math.round(u.storageUsed / 1073741824 * 100) / 100,
        fileCount: u._count.files,
        hostingEnvCount: u._count.hostingEnvs,
        hostingEnvs: u.hostingEnvs,
        recentFiles: u.files,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      overview: {
        totalStorageUsed: storageStats._sum.storageUsed || 0,
        totalStorageLimit: storageStats._sum.storageLimit || 0,
        avgStorageUsed: Math.round((storageStats._avg.storageUsed || 0) * 100) / 100,
        totalFiles,
        totalFileSize: totalFileSize._sum.size || 0,
        totalStorageUsedGB: Math.round((storageStats._sum.storageUsed || 0) / 1073741824 * 100) / 100,
        totalStorageLimitGB: Math.round((storageStats._sum.storageLimit || 0) / 1073741824 * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Admin storage error:', error);
    return NextResponse.json(
      { error: 'Failed to get storage usage data' },
      { status: 500 }
    );
  }
}
