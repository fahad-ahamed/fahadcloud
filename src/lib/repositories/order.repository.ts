import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';

export class OrderRepository extends BaseRepository<any> {
  protected model = db.order;

  async findByUserId(userId: string, params?: { status?: string; type?: string }) {
    const { status, type } = params || {};
    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;
    return db.order.findMany({
      where,
      include: {
        domain: { select: { id: true, name: true, status: true } },
        payment: { select: { id: true, status: true, trxId: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMonthlyRevenue(months: number = 12) {
    const monthlyRevenue = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const rev = await db.payment.aggregate({
        where: { status: 'paid', verifiedAt: { gte: start, lt: end } },
        _sum: { amount: true },
      });
      monthlyRevenue.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: rev._sum.amount || 0,
      });
    }
    return monthlyRevenue;
  }

  async getUserGrowth(days: number = 7) {
    const userGrowth = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await db.user.count({
        where: { role: 'customer', createdAt: { gte: day, lt: nextDay } },
      });
      userGrowth.push({
        date: day.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        count,
      });
    }
    return userGrowth;
  }
}

export const orderRepository = new OrderRepository();
