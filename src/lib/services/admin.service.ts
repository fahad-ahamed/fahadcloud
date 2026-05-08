import { db } from '@/lib/db';
import { orderRepository, paymentRepository } from '@/lib/repositories';

export class AdminService {
  async getDashboardData() {
    const [totalUsers, totalDomains, totalOrders, totalPayments, pendingPayments, paidPayments, rejectedPayments, activeDomains, freeDomains, totalRevenue, todayUsers, todayOrders, todayRevenue, recentPayments] = await Promise.all([
      db.user.count({ where: { role: 'customer' } }),
      db.domain.count(), db.order.count(), db.payment.count(),
      db.payment.count({ where: { status: { in: ['pending', 'verifying', 'manual_review'] } } }),
      db.payment.count({ where: { status: 'paid' } }),
      db.payment.count({ where: { status: 'rejected' } }),
      db.domain.count({ where: { status: 'active' } }),
      db.domain.count({ where: { isFree: true } }),
      db.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      db.user.count({ where: { role: 'customer', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.payment.aggregate({ where: { status: 'paid', verifiedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { amount: true } }),
      db.payment.findMany({ where: { status: { in: ['pending', 'verifying', 'manual_review'] } }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, order: { select: { id: true, domainName: true, type: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    const [domainOrders, hostingOrders, renewalOrders, transferOrders] = await Promise.all([
      db.order.count({ where: { type: 'domain_registration' } }),
      db.order.count({ where: { type: 'hosting' } }),
      db.order.count({ where: { type: 'renewal' } }),
      db.order.count({ where: { type: 'domain_transfer' } }),
    ]);

    const monthlyRevenue = await orderRepository.getMonthlyRevenue();
    const userGrowth = await orderRepository.getUserGrowth();

    return {
      stats: { totalUsers, totalDomains, totalOrders, totalPayments, activeDomains, freeDomains, pendingPayments, paidPayments, rejectedPayments, totalRevenue: totalRevenue._sum.amount || 0, todayUsers, todayOrders, todayRevenue: todayRevenue._sum.amount || 0 },
      orderDistribution: { domain: domainOrders, hosting: hostingOrders, renewal: renewalOrders, transfer: transferOrders },
      monthlyRevenue, userGrowth,
      recentPayments: recentPayments.map(p => ({ id: p.id, amount: p.amount, status: p.status, trxId: p.trxId, fraudScore: p.fraudScore, createdAt: p.createdAt, user: p.user, order: p.order })),
    };
  }

  async getStats() {
    const [totalUsers, totalDomains, totalOrders, totalPayments, freeDomains, paidDomains, revenue, pendingPayments, verifyingPayments, rejectedPayments] = await Promise.all([
      db.user.count(), db.domain.count(), db.order.count(), db.payment.count(),
      db.domain.count({ where: { isFree: true } }), db.domain.count({ where: { isFree: false } }),
      db.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      db.payment.count({ where: { status: 'pending' } }),
      db.payment.count({ where: { status: 'verifying' } }),
      db.payment.count({ where: { status: 'rejected' } }),
    ]);

    const orderStatusCounts = await db.order.groupBy({ by: ['status'], _count: { status: true } });
    const paymentMethodCounts = await db.payment.groupBy({ by: ['paymentMethod'], _count: { paymentMethod: true }, _sum: { amount: true } });

    return {
      overview: { totalUsers, totalDomains, totalOrders, totalPayments, freeDomains, paidDomains, totalRevenue: revenue._sum.amount || 0, pendingPayments, verifyingPayments, rejectedPayments },
      orderStatusCounts: orderStatusCounts.map(s => ({ status: s.status, count: s._count.status })),
      paymentMethodCounts: paymentMethodCounts.map(p => ({ method: p.paymentMethod, count: p._count.paymentMethod, amount: p._sum.amount || 0 })),
    };
  }
}

export const adminService = new AdminService();
