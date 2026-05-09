import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requireSuperAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';
import { userRepository, adminLogRepository } from '@/lib/repositories';

// POST /api/admin/user-action - Admin actions on user accounts
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: 'Action and userId are required' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying the super admin
    if (targetUser.email === 'admin@fahadcloud.com' && auth.user!.email !== 'admin@fahadcloud.com') {
      return NextResponse.json({ error: 'Cannot modify the super admin account' }, { status: 403 });
    }

    const ip = getClientIp(request);

    switch (action) {
      // ====== RESET USER PASSWORD ======
      case 'reset_password': {
        const { newPassword } = body;
        if (!newPassword || newPassword.length < 6) {
          return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.user.update({ where: { id: userId }, data: { password: hashedPassword } });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_password_reset', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email }), ipAddress: ip,
        });
        return NextResponse.json({ message: 'Password reset successfully', userId });
      }

      // ====== UPDATE USER BALANCE ======
      case 'update_balance': {
        const { amount, balanceAction } = body; // balanceAction: 'add', 'deduct', 'set'
        if (typeof amount !== 'number' || amount < 0) {
          return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }
        let newBalance = targetUser.balance;
        if (balanceAction === 'add') newBalance += amount;
        else if (balanceAction === 'deduct') newBalance = Math.max(0, newBalance - amount);
        else if (balanceAction === 'set') newBalance = amount;
        else return NextResponse.json({ error: 'Invalid balance action' }, { status: 400 });

        await db.user.update({ where: { id: userId }, data: { balance: newBalance } });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_balance_updated', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email, previousBalance: targetUser.balance, newBalance, balanceAction, amount }),
          ipAddress: ip,
        });
        return NextResponse.json({ message: 'Balance updated successfully', userId, newBalance });
      }

      // ====== VERIFY USER EMAIL MANUALLY ======
      case 'verify_email': {
        if (targetUser.emailVerified) {
          return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
        }
        await db.user.update({ where: { id: userId }, data: { emailVerified: true } });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_email_verified', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email }), ipAddress: ip,
        });
        return NextResponse.json({ message: 'Email verified successfully', userId });
      }

      // ====== UPDATE USER PROFILE ======
      case 'update_profile': {
        const { firstName, lastName, phone, company, address, city, country } = body;
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (company !== undefined) updateData.company = company;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (country !== undefined) updateData.country = country;

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        await db.user.update({ where: { id: userId }, data: updateData });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_profile_updated', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email, updatedFields: Object.keys(updateData) }),
          ipAddress: ip,
        });
        return NextResponse.json({ message: 'Profile updated successfully', userId });
      }

      // ====== UPDATE USER STORAGE LIMIT ======
      case 'update_storage': {
        const { storageLimit } = body; // in bytes
        if (typeof storageLimit !== 'number' || storageLimit < 0) {
          return NextResponse.json({ error: 'Valid storage limit is required' }, { status: 400 });
        }
        await db.user.update({ where: { id: userId }, data: { storageLimit } });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_storage_updated', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email, previousLimit: targetUser.storageLimit, newLimit: storageLimit }),
          ipAddress: ip,
        });
        return NextResponse.json({ message: 'Storage limit updated successfully', userId });
      }

      // ====== SEND NOTIFICATION TO USER ======
      case 'send_notification': {
        const { title, message, type } = body;
        if (!title || !message) {
          return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }
        await db.notification.create({
          data: { userId, title, message, type: type || 'info' },
        });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'notification_sent', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email, title, type: type || 'info' }),
          ipAddress: ip,
        });
        return NextResponse.json({ message: 'Notification sent successfully', userId });
      }

      // ====== CHANGE USER ROLE ======
      case 'change_role': {
        const superAuth = await requireSuperAdmin(request);
        if (!superAuth.authenticated) return authErrorResponse(superAuth);
        const { role } = body;
        const validRoles = ['customer', 'admin', 'moderator'];
        if (!validRoles.includes(role)) {
          return NextResponse.json({ error: `Invalid role. Valid: ${validRoles.join(', ')}` }, { status: 400 });
        }
        await db.user.update({ where: { id: userId }, data: { role } });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_role_changed', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email, previousRole: targetUser.role, newRole: role }),
          ipAddress: ip,
        });
        return NextResponse.json({ message: 'Role changed successfully', userId });
      }

      // ====== DELETE ALL USER ACTIVITY LOGS ======
      case 'clear_activity': {
        await db.userActivityLog.deleteMany({ where: { userId } });
        await adminLogRepository.logAction({
          adminId: auth.user!.userId, action: 'user_activity_cleared', targetType: 'user', targetId: userId,
          details: JSON.stringify({ email: targetUser.email }), ipAddress: ip,
        });
        return NextResponse.json({ message: 'User activity logs cleared', userId });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin user action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform action' }, { status: 500 });
  }
}
