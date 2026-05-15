
import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<any> {
  protected model = db.user;

  async findByEmail(email: string) {
    return db.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findByEmailWithCounts(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true, email: true, firstName: true, lastName: true, company: true,
        phone: true, address: true, city: true, country: true, avatar: true,
        role: true, adminRole: true, balance: true, storageLimit: true,
        storageUsed: true, twoFactorEnabled: true, emailVerified: true,
        lastLoginAt: true, loginIp: true, createdAt: true, updatedAt: true,
        _count: { select: { domains: true, orders: true } },
      },
    });
  }

  async findByIdWithDetails(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, company: true,
        phone: true, address: true, city: true, country: true, avatar: true,
        role: true, adminRole: true, balance: true, storageLimit: true,
        storageUsed: true, twoFactorEnabled: true, emailVerified: true,
        lastLoginAt: true, loginIp: true, createdAt: true, updatedAt: true,
        _count: { select: { domains: true, orders: true, payments: true } },
      },
    });
  }

  async searchUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const { search, role, status, page = 1, limit = 20 } = params;
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role) where.role = role;
    // Support filtering by status (blocked/active)
    if (status === 'blocked') {
      where.role = 'blocked';
    } else if (status === 'active') {
      where.role = { in: ['customer', 'admin', 'moderator'] };
    } else if (status === 'unverified') {
      where.emailVerified = false;
      where.role = { not: 'blocked' };
    }
    return this.paginate({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true, company: true,
        phone: true, role: true, adminRole: true, balance: true, storageLimit: true,
        storageUsed: true, emailVerified: true, lastLoginAt: true, loginIp: true, createdAt: true,
        _count: { select: { domains: true, orders: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
    });
  }

  async updateLastLogin(userId: string, ip: string) {
    return db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), loginIp: ip },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; company?: string; address?: string; city?: string; country?: string }) {
    return db.user.update({ where: { id: userId }, data });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return db.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  }

  async verifyEmail(userId: string) {
    return db.user.update({ where: { id: userId }, data: { emailVerified: true } });
  }

  async blockUser(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { role: 'blocked' },
    });
  }

  async unblockUser(userId: string, previousRole: string = 'customer') {
    return db.user.update({
      where: { id: userId },
      data: { role: previousRole },
    });
  }

  async getUserStats() {
    const [totalUsers, activeUsers, blockedUsers, adminUsers, unverifiedUsers, todayUsers, thisWeekUsers, thisMonthUsers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: { in: ['customer', 'admin', 'moderator'] } } }),
      db.user.count({ where: { role: 'blocked' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.user.count({ where: { emailVerified: false, role: { not: 'blocked' } } }),
      db.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.user.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      adminUsers,
      unverifiedUsers,
      todayUsers,
      thisWeekUsers,
      thisMonthUsers,
    };
  }

  async deleteWithCascade(userId: string) {
    // Use transaction to ensure atomicity — if any step fails, all changes are rolled back
    return db.$transaction(async (tx) => {
      // Delete all related records in order of dependency
      await tx.notification.deleteMany({ where: { userId } });
      await tx.cartItem.deleteMany({ where: { userId } });
      await tx.agentMemory.deleteMany({ where: { userId } });
      await tx.agentToolExecution.deleteMany({ where: { userId } });
      // Delete agent sessions and their messages
      const sessions = await tx.agentSession.findMany({ where: { userId }, select: { id: true } });
      for (const s of sessions) {
        await tx.agentTaskLog.deleteMany({ where: { task: { sessionId: s.id } } });
        await tx.agentTask.deleteMany({ where: { sessionId: s.id } });
        await tx.agentMessage.deleteMany({ where: { sessionId: s.id } });
      }
      await tx.agentSession.deleteMany({ where: { userId } });
      // Delete files, databases, hosting envs
      await tx.fileEntry.deleteMany({ where: { userId } });
      await tx.userDatabase.deleteMany({ where: { userId } });
      // Delete hosting environments and their backups
      const hostEnvs = await tx.hostingEnvironment.findMany({ where: { userId }, select: { id: true } });
      for (const h of hostEnvs) {
        await tx.backup.deleteMany({ where: { hostingEnvId: h.id } });
      }
      await tx.hostingEnvironment.deleteMany({ where: { userId } });
      // Delete domains and their DNS records
      const domains = await tx.domain.findMany({ where: { userId }, select: { id: true } });
      for (const d of domains) {
        await tx.dnsRecord.deleteMany({ where: { domainId: d.id } });
      }
      await tx.domain.deleteMany({ where: { userId } });
      // Delete payments and their logs
      const payments = await tx.payment.findMany({ where: { userId }, select: { id: true } });
      for (const p of payments) {
        await tx.paymentLog.deleteMany({ where: { paymentId: p.id } });
      }
      await tx.payment.deleteMany({ where: { userId } });
      await tx.order.deleteMany({ where: { userId } });
      // Finally delete user
      return tx.user.delete({ where: { id: userId } });
    });
  }
}

export const userRepository = new UserRepository();
