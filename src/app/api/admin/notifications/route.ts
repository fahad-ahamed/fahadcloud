import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse, getClientIp } from '@/lib/middleware';
import { adminLogRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const read = searchParams.get('read') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get system-wide notifications (for admin user)
    const where: any = { userId: auth.user!.userId };
    if (type) where.type = type;
    if (read !== undefined) where.read = read === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: auth.user!.userId, read: false } }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    });
  } catch (error: any) {
    console.error('Admin notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { userId, title, message, type = 'info' } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      );
    }

    const validTypes = ['info', 'warning', 'error', 'success', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: { userId, title, message, type },
    });

    const ip = getClientIp(request);
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'notification_sent',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({ title, type }),
      ipAddress: ip,
    });

    return NextResponse.json({ message: 'Notification sent successfully', notification }, { status: 201 });
  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: auth.user!.userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
