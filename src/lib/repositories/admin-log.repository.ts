import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';

export class AdminLogRepository extends BaseRepository<any> {
  protected model = db.adminLog;

  async logAction(data: { adminId: string; action: string; targetType?: string; targetId?: string; details?: string; ipAddress?: string }) {
    return db.adminLog.create({ data });
  }

  async findByAdmin(adminId: string, limit: number = 50) {
    return db.adminLog.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByTarget(targetType: string, targetId: string) {
    return db.adminLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchLogs(params: {
    action?: string;
    adminId?: string;
    targetType?: string;
    targetId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { action, adminId, targetType, targetId, startDate, endDate, page = 1, limit = 50 } = params;
    const where: any = {};
    if (action) where.action = { contains: action };
    if (adminId) where.adminId = adminId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      db.adminLog.findMany({
        where,
        include: {
          // We can't include admin relation since AdminLog doesn't have a relation to User
          // We'll resolve admin info separately if needed
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.adminLog.count({ where }),
    ]);

    // Fetch admin details for the logs
    const adminIds = [...new Set(items.map(l => l.adminId))];
    const admins = adminIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        })
      : [];
    const adminMap = new Map(admins.map(a => [a.id, a]));

    return {
      items: items.map(l => ({
        ...l,
        admin: adminMap.get(l.adminId) || null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRecentActivity(limit: number = 20) {
    const logs = await db.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const adminIds = [...new Set(logs.map(l => l.adminId))];
    const admins = adminIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        })
      : [];
    const adminMap = new Map(admins.map(a => [a.id, a]));

    return logs.map(l => ({
      ...l,
      admin: adminMap.get(l.adminId) || null,
    }));
  }

  async getActionCounts() {
    const counts = await db.adminLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });
    return counts.map(c => ({ action: c.action, count: c._count.action }));
  }

  async getDailyActivity(days: number = 30) {
    const activity = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await db.adminLog.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      activity.push({
        date: start.toISOString().split('T')[0],
        count,
      });
    }
    return activity;
  }
}

export const adminLogRepository = new AdminLogRepository();
