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
}

export const adminLogRepository = new AdminLogRepository();
