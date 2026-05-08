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

  async searchUsers(params: { search?: string; role?: string; page?: number; limit?: number }) {
    const { search, role, page = 1, limit = 20 } = params;
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
    return this.paginate({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true, company: true,
        phone: true, role: true, adminRole: true, balance: true, storageLimit: true,
        storageUsed: true, lastLoginAt: true, loginIp: true, createdAt: true,
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

  async deleteWithCascade(userId: string) {
    // Delete all related records first
    await db.notification.deleteMany({ where: { userId } });
    await db.cartItem.deleteMany({ where: { userId } });
    await db.agentMemory.deleteMany({ where: { userId } });
    await db.agentToolExecution.deleteMany({ where: { userId } });
    // Delete agent sessions and their messages
    const sessions = await db.agentSession.findMany({ where: { userId }, select: { id: true } });
    for (const s of sessions) {
      await db.agentMessage.deleteMany({ where: { sessionId: s.id } });
      await db.agentTaskLog.deleteMany({ where: { task: { sessionId: s.id } } });
      await db.agentTask.deleteMany({ where: { sessionId: s.id } });
    }
    await db.agentSession.deleteMany({ where: { userId } });
    // Delete files, databases, hosting envs
    await db.fileEntry.deleteMany({ where: { userId } });
    await db.userDatabase.deleteMany({ where: { userId } });
    // Delete hosting environments and their backups
    const hostEnvs = await db.hostingEnvironment.findMany({ where: { userId }, select: { id: true } });
    for (const h of hostEnvs) {
      await db.backup.deleteMany({ where: { hostingEnvId: h.id } });
    }
    await db.hostingEnvironment.deleteMany({ where: { userId } });
    // Delete domains and their DNS records
    const domains = await db.domain.findMany({ where: { userId }, select: { id: true } });
    for (const d of domains) {
      await db.dnsRecord.deleteMany({ where: { domainId: d.id } });
    }
    await db.domain.deleteMany({ where: { userId } });
    // Delete payments and their logs
    const payments = await db.payment.findMany({ where: { userId }, select: { id: true } });
    for (const p of payments) {
      await db.paymentLog.deleteMany({ where: { paymentId: p.id } });
    }
    await db.payment.deleteMany({ where: { userId } });
    await db.order.deleteMany({ where: { userId } });
    // Finally delete user
    return db.user.delete({ where: { id: userId } });
  }
}

export const userRepository = new UserRepository();
