import { db } from '@/lib/db';
import { orderRepository, paymentRepository, userRepository, adminLogRepository } from '@/lib/repositories';

export class AdminService {
  async getDashboardData() {
    const [
      totalUsers, activeUsers, blockedUsers, adminUsers, unverifiedUsers,
      totalDomains, totalOrders, totalPayments, pendingPayments, paidPayments,
      rejectedPayments, activeDomains, freeDomains, totalRevenue, todayUsers,
      todayOrders, todayRevenue, recentPayments
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: { in: ['customer', 'admin', 'moderator'] } } }),
      db.user.count({ where: { role: 'blocked' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.user.count({ where: { emailVerified: false, role: { not: 'blocked' } } }),
      db.domain.count(),
      db.order.count(),
      db.payment.count(),
      db.payment.count({ where: { status: { in: ['pending', 'verifying', 'manual_review'] } } }),
      db.payment.count({ where: { status: 'paid' } }),
      db.payment.count({ where: { status: 'rejected' } }),
      db.domain.count({ where: { status: 'active' } }),
      db.domain.count({ where: { isFree: true } }),
      db.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      db.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.payment.aggregate({ where: { status: 'paid', verifiedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { amount: true } }),
      db.payment.findMany({
        where: { status: { in: ['pending', 'verifying', 'manual_review'] } },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          order: { select: { id: true, domainName: true, type: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
    ]);

    const [domainOrders, hostingOrders, renewalOrders, transferOrders] = await Promise.all([
      db.order.count({ where: { type: 'domain_registration' } }),
      db.order.count({ where: { type: 'hosting' } }),
      db.order.count({ where: { type: 'renewal' } }),
      db.order.count({ where: { type: 'domain_transfer' } }),
    ]);

    const monthlyRevenue = await orderRepository.getMonthlyRevenue();
    const userGrowth = await orderRepository.getUserGrowth();
    const recentActivity = await adminLogRepository.getRecentActivity(5);

    return {
      stats: {
        totalUsers, activeUsers, blockedUsers, adminUsers, unverifiedUsers,
        totalDomains, totalOrders, totalPayments, activeDomains, freeDomains,
        pendingPayments, paidPayments, rejectedPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
        todayUsers, todayOrders, todayRevenue: todayRevenue._sum.amount || 0,
      },
      orderDistribution: { domain: domainOrders, hosting: hostingOrders, renewal: renewalOrders, transfer: transferOrders },
      monthlyRevenue,
      userGrowth,
      recentActivity,
      recentPayments: recentPayments.map(p => ({
        id: p.id, amount: p.amount, status: p.status, trxId: p.trxId,
        fraudScore: p.fraudScore, createdAt: p.createdAt, user: p.user, order: p.order,
      })),
    };
  }

  async getStats() {
    const [
      totalUsers, activeUsers, blockedUsers, adminUsers, unverifiedUsers,
      totalDomains, totalOrders, totalPayments, freeDomains, paidDomains,
      revenue, pendingPayments, verifyingPayments, rejectedPayments
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: { in: ['customer', 'admin', 'moderator'] } } }),
      db.user.count({ where: { role: 'blocked' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.user.count({ where: { emailVerified: false, role: { not: 'blocked' } } }),
      db.domain.count(),
      db.order.count(),
      db.payment.count(),
      db.domain.count({ where: { isFree: true } }),
      db.domain.count({ where: { isFree: false } }),
      db.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      db.payment.count({ where: { status: 'pending' } }),
      db.payment.count({ where: { status: 'verifying' } }),
      db.payment.count({ where: { status: 'rejected' } }),
    ]);

    const orderStatusCounts = await db.order.groupBy({ by: ['status'], _count: { status: true } });
    const paymentMethodCounts = await db.payment.groupBy({ by: ['paymentMethod'], _count: { paymentMethod: true }, _sum: { amount: true } });

    return {
      overview: {
        totalUsers, activeUsers, blockedUsers, adminUsers, unverifiedUsers,
        totalDomains, totalOrders, totalPayments, freeDomains, paidDomains,
        totalRevenue: revenue._sum.amount || 0,
        pendingPayments, verifyingPayments, rejectedPayments,
      },
      orderStatusCounts: orderStatusCounts.map(s => ({ status: s.status, count: s._count.status })),
      paymentMethodCounts: paymentMethodCounts.map(p => ({
        method: p.paymentMethod,
        count: p._count.paymentMethod,
        total: p._sum.amount || 0,
      })),
    };
  }

  async getAnalytics(params: { period?: string; startDate?: string; endDate?: string }) {
    const { period = '30d', startDate, endDate } = params;

    let start: Date;
    let end: Date = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      const days = parseInt(period) || 30;
      start = new Date();
      start.setDate(start.getDate() - days);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // User registration trends
    const userTrends = await this.getDailyAggregation('user', 'createdAt', start, end);

    // Revenue trends
    const revenueTrends = await this.getDailyAggregation('payment', 'verifiedAt', start, end, { status: 'paid' }, 'amount');

    // Order trends
    const orderTrends = await this.getDailyAggregation('order', 'createdAt', start, end);

    // Domain registration trends
    const domainTrends = await this.getDailyAggregation('domain', 'registeredAt', start, end);

    // User role distribution
    const roleDistribution = await db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Payment status distribution
    const paymentStatusDistribution = await db.payment.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { amount: true },
    });

    // Monthly comparison
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

    const [thisMonthUsers, lastMonthUsers, thisMonthRevenue, lastMonthRevenue, thisMonthOrders, lastMonthOrders] = await Promise.all([
      db.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      db.user.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      db.payment.aggregate({ where: { status: 'paid', verifiedAt: { gte: thisMonthStart } }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: 'paid', verifiedAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { amount: true } }),
      db.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
      db.order.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ]);

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      trends: { users: userTrends, revenue: revenueTrends, orders: orderTrends, domains: domainTrends },
      distributions: {
        roles: roleDistribution.map(r => ({ role: r.role, count: r._count.role })),
        paymentStatuses: paymentStatusDistribution.map(p => ({
          status: p.status, count: p._count.status, total: p._sum.amount || 0,
        })),
      },
      monthlyComparison: {
        users: { thisMonth: thisMonthUsers, lastMonth: lastMonthUsers, change: lastMonthUsers > 0 ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0 },
        revenue: { thisMonth: thisMonthRevenue._sum.amount || 0, lastMonth: lastMonthRevenue._sum.amount || 0, change: (lastMonthRevenue._sum.amount || 0) > 0 ? Math.round((((thisMonthRevenue._sum.amount || 0) - (lastMonthRevenue._sum.amount || 0)) / (lastMonthRevenue._sum.amount || 1)) * 100) : 0 },
        orders: { thisMonth: thisMonthOrders, lastMonth: lastMonthOrders, change: lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : 0 },
      },
    };
  }

  private async getDailyAggregation(model: string, dateField: string, start: Date, end: Date, whereExtra?: any, sumField?: string) {
    const days: { date: string; count: number; total?: number }[] = [];
    const modelAny = (db as any)[model];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const where: any = {
        [dateField]: { gte: dayStart, lte: dayEnd },
        ...whereExtra,
      };

      const count = await modelAny.count({ where });

      let total = 0;
      if (sumField) {
        const agg = await modelAny.aggregate({ where, _sum: { [sumField]: true } });
        total = (agg._sum as any)[sumField] || 0;
      }

      days.push({ date: dayStart.toISOString().split('T')[0], count, ...(sumField ? { total } : {}) });
    }

    return days;
  }
}

export const adminService = new AdminService();
