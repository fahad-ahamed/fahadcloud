import { NextRequest, NextResponse } from 'next/server';
import { userRepository, adminLogRepository } from '@/lib/repositories';
import { requireAdmin, requireSuperAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await userRepository.searchUsers({ search, role, status, page, limit });

    return NextResponse.json({
      users: result.items.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        company: u.company,
        phone: u.phone,
        role: u.role,
        adminRole: u.adminRole,
        balance: u.balance,
        storageLimit: u.storageLimit,
        storageUsed: u.storageUsed,
        storagePercentage: Math.round((u.storageUsed / u.storageLimit) * 100),
        emailVerified: u.emailVerified,
        lastLoginAt: u.lastLoginAt,
        loginIp: u.loginIp,
        createdAt: u.createdAt,
        domainCount: u._count.domains,
        orderCount: u._count.orders,
        paymentCount: u._count.payments,
        isBlocked: u.role === 'blocked',
      })),
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { userId, role, adminRole, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying the super admin
    if (targetUser.email === 'admin@fahadcloud.com' && auth.user!.email !== 'admin@fahadcloud.com') {
      return NextResponse.json({ error: 'Cannot modify the super admin account' }, { status: 403 });
    }

    const ip = getClientIp(request);

    // Handle block/unblock actions
    if (action === 'block') {
      if (targetUser.role === 'blocked') {
        return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
      }
      const previousRole = targetUser.role;
      await userRepository.blockUser(userId);
      await adminLogRepository.logAction({
        adminId: auth.user!.userId,
        action: 'user_blocked',
        targetType: 'user',
        targetId: userId,
        details: JSON.stringify({ previousRole, email: targetUser.email }),
        ipAddress: ip,
      });
      return NextResponse.json({ message: 'User blocked successfully', userId });
    }

    if (action === 'unblock') {
      if (targetUser.role !== 'blocked') {
        return NextResponse.json({ error: 'User is not blocked' }, { status: 400 });
      }
      // Default to 'customer' role on unblock, or use provided role
      const newRole = role || 'customer';
      await userRepository.unblockUser(userId, newRole);
      await adminLogRepository.logAction({
        adminId: auth.user!.userId,
        action: 'user_unblocked',
        targetType: 'user',
        targetId: userId,
        details: JSON.stringify({ newRole, email: targetUser.email }),
        ipAddress: ip,
      });
      return NextResponse.json({ message: 'User unblocked successfully', userId });
    }

    // Handle role update (requires super admin)
    if (role || adminRole !== undefined) {
      const superAuth = await requireSuperAdmin(request);
      if (!superAuth.authenticated) return authErrorResponse(superAuth);

      const updateData: any = {};
      if (role) {
        const validRoles = ['customer', 'admin', 'moderator', 'blocked'];
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: `Invalid role. Valid roles: ${validRoles.join(', ')}` },
            { status: 400 }
          );
        }
        updateData.role = role;
      }
      if (adminRole !== undefined) {
        if (role === 'admin' || targetUser.role === 'admin') {
          const validAdminRoles = ['super_admin', 'sub_admin', null];
          if (!validAdminRoles.includes(adminRole)) {
            return NextResponse.json(
              { error: 'Invalid admin role' },
              { status: 400 }
            );
          }
          updateData.adminRole = adminRole;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      const updatedUser = await userRepository.update(userId, updateData);

      await adminLogRepository.logAction({
        adminId: auth.user!.userId,
        action: 'user_role_updated',
        targetType: 'user',
        targetId: userId,
        details: JSON.stringify({
          previousRole: targetUser.role,
          newRole: updateData.role || targetUser.role,
          previousAdminRole: targetUser.adminRole,
          newAdminRole: updateData.adminRole !== undefined ? updateData.adminRole : targetUser.adminRole,
        }),
        ipAddress: ip,
      });

      return NextResponse.json({
        message: 'User role updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          adminRole: updatedUser.adminRole,
        },
      });
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting the super admin
    if (targetUser.email === 'admin@fahadcloud.com') {
      return NextResponse.json({ error: 'Cannot delete the super admin account' }, { status: 403 });
    }

    const ip = getClientIp(request);

    // Log before deletion (since user will be gone)
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'user_deleted',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        balance: targetUser.balance,
      }),
      ipAddress: ip,
    });

    await userRepository.deleteWithCascade(userId);

    return NextResponse.json({ message: 'User deleted successfully', userId });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
