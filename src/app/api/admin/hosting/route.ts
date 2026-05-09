import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminLogRepository } from '@/lib/repositories';
import { requireAdmin, requireSuperAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [environments, total] = await Promise.all([
      db.hostingEnvironment.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          domain: { select: { id: true, name: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.hostingEnvironment.count({ where }),
    ]);

    // Get hosting plan stats
    const planStats = await db.hostingEnvironment.groupBy({
      by: ['planSlug'],
      _count: true,
    });

    const statusStats = await db.hostingEnvironment.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      environments: environments.map(env => ({
        id: env.id,
        userId: env.userId,
        domainId: env.domainId,
        planSlug: env.planSlug,
        status: env.status,
        rootPath: env.rootPath,
        serverType: env.serverType,
        nodeVersion: env.nodeVersion,
        phpVersion: env.phpVersion,
        pythonVersion: env.pythonVersion,
        sslEnabled: env.sslEnabled,
        sslExpiry: env.sslExpiry,
        bandwidthUsed: env.bandwidthUsed,
        storageUsed: env.storageUsed,
        storageLimit: env.storageLimit,
        storagePercentage: Math.round((env.storageUsed / env.storageLimit) * 100),
        dockerContainerId: env.dockerContainerId,
        dockerStatus: env.dockerStatus,
        lastDeployedAt: env.lastDeployedAt,
        createdAt: env.createdAt,
        user: env.user,
        domain: env.domain,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byPlan: planStats,
        byStatus: statusStats,
      },
    });
  } catch (error: any) {
    console.error('Admin hosting error:', error);
    return NextResponse.json(
      { error: 'Failed to list hosting environments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { userId, domainId, planSlug = 'starter', serverType = 'static', rootPath, nodeVersion, phpVersion, pythonVersion, storageLimit = 5368709120 } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If domainId provided, verify it belongs to user
    if (domainId) {
      const domain = await db.domain.findFirst({ where: { id: domainId, userId } });
      if (!domain) {
        return NextResponse.json(
          { error: 'Domain not found or does not belong to user' },
          { status: 404 }
        );
      }
    }

    const envRootPath = rootPath || `/home/hosting/${userId}/${domainId ? 'domain' : 'default'}`;

    const env = await db.hostingEnvironment.create({
      data: {
        userId,
        domainId: domainId || null,
        planSlug,
        status: 'provisioning',
        rootPath: envRootPath,
        serverType,
        nodeVersion: nodeVersion || null,
        phpVersion: phpVersion || null,
        pythonVersion: pythonVersion || null,
        sslEnabled: false,
        storageUsed: 0,
        storageLimit,
      },
    });

    const ip = getClientIp(request);

    // Log admin action
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'hosting_env_created',
      targetType: 'hostingEnvironment',
      targetId: env.id,
      details: JSON.stringify({
        userId,
        domainId,
        planSlug,
        serverType,
        rootPath: envRootPath,
      }),
      ipAddress: ip,
    });

    return NextResponse.json({
      message: 'Hosting environment created successfully',
      environment: env,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create hosting env error:', error);
    return NextResponse.json(
      { error: 'Failed to create hosting environment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { id, envId, status, rootPath, sslEnabled, planSlug, serverType, storageLimit } = body;

    if (!id && !envId) {
      return NextResponse.json(
        { error: 'Environment ID is required' },
        { status: 400 }
      );
    }

    const env = await db.hostingEnvironment.findUnique({ where: { id: id || envId } });
    if (!env) {
      return NextResponse.json({ error: 'Hosting environment not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      const validStatuses = ['active', 'suspended', 'provisioning', 'error'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Valid: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (sslEnabled !== undefined) updateData.sslEnabled = sslEnabled;
    if (planSlug) updateData.planSlug = planSlug;
    if (serverType) updateData.serverType = serverType;
    if (storageLimit !== undefined) updateData.storageLimit = storageLimit;
    if (rootPath !== undefined) updateData.rootPath = rootPath;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updated = await db.hostingEnvironment.update({
      where: { id: id || envId },
      data: updateData,
    });

    const ip = getClientIp(request);

    // Log admin action
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'hosting_env_updated',
      targetType: 'hostingEnvironment',
      targetId: envId,
      details: JSON.stringify({
        userId: env.userId,
        previousStatus: env.status,
        newStatus: updateData.status || env.status,
        updates: updateData,
      }),
      ipAddress: ip,
    });

    return NextResponse.json({
      message: 'Hosting environment updated successfully',
      environment: updated,
    });
  } catch (error: any) {
    console.error('Update hosting env error:', error);
    return NextResponse.json(
      { error: 'Failed to update hosting environment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Environment ID is required' }, { status: 400 });
    }

    const env = await db.hostingEnvironment.findUnique({ where: { id } });
    if (!env) {
      return NextResponse.json({ error: 'Hosting environment not found' }, { status: 404 });
    }

    await db.hostingEnvironment.delete({ where: { id } });

    const ip = getClientIp(request);
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'hosting_env_deleted',
      targetType: 'hostingEnvironment',
      targetId: id,
      details: JSON.stringify({ userId: env.userId, planSlug: env.planSlug, rootPath: env.rootPath }),
      ipAddress: ip,
    });

    return NextResponse.json({ message: 'Hosting environment deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete hosting error:', error);
    return NextResponse.json({ error: 'Failed to delete hosting environment' }, { status: 500 });
  }
}
