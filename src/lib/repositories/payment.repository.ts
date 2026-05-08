import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';

export class PaymentRepository extends BaseRepository<any> {
  protected model = db.payment;

  async findByTrxId(trxId: string) {
    return db.payment.findUnique({ where: { trxId: trxId.trim().toUpperCase() } });
  }

  async findByOrderId(orderId: string) {
    return db.payment.findFirst({ where: { orderId }, include: { order: true } });
  }

  async findByUserId(userId: string, params?: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params || {};
    const where: any = { userId };
    if (status) where.status = status;
    return this.paginate({
      where,
      include: {
        order: { select: { id: true, type: true, description: true, domainName: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
    });
  }

  async searchPayments(params: { status?: string; userId?: string; search?: string; page?: number; limit?: number }) {
    const { status, userId, search, page = 1, limit = 20 } = params;
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { trxId: { contains: search } },
        { senderNumber: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
      ];
    }
    return this.paginate({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: { select: { id: true, type: true, description: true, domainName: true, status: true, paymentStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
    });
  }

  async getPaymentStats(where?: any) {
    const [totalAmount, paidStats, pendingCount, rejectedCount, fraudCount] = await Promise.all([
      db.payment.aggregate({ where, _sum: { amount: true }, _count: true }),
      db.payment.aggregate({ where: { ...where, status: 'paid' }, _sum: { amount: true }, _count: true }),
      db.payment.count({ where: { ...where, status: { in: ['pending', 'verifying'] } } }),
      db.payment.count({ where: { ...where, status: 'rejected' } }),
      db.payment.count({ where: { ...where, fraudScore: { gte: 30 } } }),
    ]);
    return {
      totalAmount: totalAmount._sum.amount || 0,
      totalCount: totalAmount._count,
      paidAmount: paidStats._sum.amount || 0,
      paidCount: paidStats._count,
      pendingCount,
      rejectedCount,
      fraudCount,
    };
  }

  async createPaymentLog(data: { paymentId: string; action: string; details: string; performedBy?: string; ipAddress?: string }) {
    return db.paymentLog.create({ data });
  }

  async findRecentByUser(userId: string, minutesAgo: number = 60) {
    return db.payment.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - minutesAgo * 60 * 1000) } },
    });
  }

  async findRecentByIp(ip: string, minutesAgo: number = 60) {
    return db.payment.findMany({
      where: { ipAddress: ip, createdAt: { gte: new Date(Date.now() - minutesAgo * 60 * 1000) } },
    });
  }
}

export const paymentRepository = new PaymentRepository();
