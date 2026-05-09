import { db } from '@/lib/db';
import { paymentRepository, orderRepository, adminLogRepository, domainRepository } from '@/lib/repositories';
import { checkRateLimit } from '@/lib/rateLimit';
import { validateTrxIdFormat, validateBkashNumber, verifyBkashPayment, usdToBdt } from '@/lib/bkash';

export class PaymentService {
  async createPayment(userId: string, data: { orderId: string; trxId: string; senderNumber?: string }, ip: string, userAgent?: string) {
    const rateLimit = checkRateLimit(ip, 'payment_submit');
    if (!rateLimit.allowed) return { error: 'Too many payment attempts. Please try again later.', status: 429 };

    const { orderId, trxId, senderNumber } = data;
    if (!orderId || !trxId) return { error: 'Order ID and TRX ID are required', status: 400 };

    const trxValidation = validateTrxIdFormat(trxId);
    if (!trxValidation.valid) return { error: trxValidation.error, status: 400 };

    let formattedNumber: string | undefined;
    if (senderNumber) {
      const numberValidation = validateBkashNumber(senderNumber);
      if (!numberValidation.valid) return { error: numberValidation.error, status: 400 };
      formattedNumber = numberValidation.formatted;
    }

    const order = await db.order.findFirst({ where: { id: orderId, userId } });
    if (!order) return { error: 'Order not found', status: 404 };
    if (order.paymentStatus === 'paid') return { error: 'Order is already paid', status: 400 };

    const existingPayment = await paymentRepository.findByTrxId(trxId);
    if (existingPayment) return { error: 'This TRX ID has already been used for another payment', status: 409 };

    // Fraud scoring
    let fraudScore = 0;
    const fraudFlags: string[] = [];
    const recentPayments = await paymentRepository.findRecentByUser(userId);
    if (recentPayments.length >= 3) { fraudScore += 30; fraudFlags.push('rapid_submissions'); }
    const similarTrxPayments = await db.payment.findMany({ where: { trxId: { startsWith: trxId.trim().toUpperCase().substring(0, 4) }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    if (similarTrxPayments.length >= 2) { fraudScore += 20; fraudFlags.push('similar_trx_pattern'); }
    if (order.amount <= 0) { fraudScore += 50; fraudFlags.push('zero_amount'); }
    const ipPayments = await paymentRepository.findRecentByIp(ip);
    const uniqueUserIds = new Set(ipPayments.map(p => p.userId));
    if (uniqueUserIds.size >= 3) { fraudScore += 40; fraudFlags.push('multiple_users_same_ip'); }

    const payment = await db.payment.create({
      data: {
        orderId: order.id, userId, amount: order.amount, currency: 'BDT', paymentMethod: 'bkash',
        status: fraudScore >= 50 ? 'manual_review' : 'pending', trxId: trxId.trim().toUpperCase(),
        senderNumber: formattedNumber || null, paymentTime: new Date(), fraudScore,
        fraudFlags: fraudFlags.length > 0 ? JSON.stringify(fraudFlags) : null,
        isDuplicate: false, ipAddress: ip, userAgent: userAgent || null,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: fraudScore >= 50 ? 'manual_review' : 'pending', status: fraudScore >= 50 ? 'manual_review' : 'verifying', bKashTrxId: trxId.trim().toUpperCase(), bKashNumber: formattedNumber || order.bKashNumber },
    });

    await paymentRepository.createPaymentLog({
      paymentId: payment.id, action: 'created',
      details: JSON.stringify({ orderId: order.id, trxId: trxId.trim().toUpperCase(), amount: order.amount, fraudScore, fraudFlags }),
      performedBy: userId, ipAddress: ip,
    });

    return {
      message: fraudScore >= 50 ? 'Payment submitted for manual review due to fraud risk' : 'Payment submitted successfully and pending verification',
      payment: { id: payment.id, amount: payment.amount, currency: payment.currency, status: payment.status, trxId: payment.trxId, fraudScore: payment.fraudScore, fraudFlags: payment.fraudFlags ? JSON.parse(payment.fraudFlags) : [], createdAt: payment.createdAt },
      status: 201,
    };
  }

  async approvePayment(paymentId: string, adminId: string, adminNotes?: string, ip?: string) {
    // Direct lookup by ID below
    const paymentRecord = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!paymentRecord) return { error: 'Payment not found', status: 404 };
    if (paymentRecord.status === 'paid') return { error: 'Payment is already approved', status: 400 };
    if (paymentRecord.status === 'rejected') return { error: 'Payment has been rejected', status: 400 };

    await db.payment.update({ where: { id: paymentId }, data: { status: 'paid', verifiedAt: new Date(), verifiedBy: adminId, verifiedAmount: paymentRecord.amount } });
    await db.order.update({ where: { id: paymentRecord.orderId }, data: { paymentStatus: 'paid', status: 'paid', verifiedAt: new Date(), verifiedBy: adminId, adminNotes: adminNotes || null } });

    await paymentRepository.createPaymentLog({
      paymentId: paymentRecord.id, action: 'approved',
      details: JSON.stringify({ amount: paymentRecord.amount, trxId: paymentRecord.trxId, adminNotes, approvedBy: adminId }),
      performedBy: adminId, ipAddress: ip,
    });
    await adminLogRepository.logAction({ adminId, action: 'payment_approved', targetType: 'payment', targetId: paymentRecord.id, details: JSON.stringify({ orderId: paymentRecord.orderId, amount: paymentRecord.amount, trxId: paymentRecord.trxId, adminNotes }), ipAddress: ip });

    // Auto domain registration for domain orders
    if (paymentRecord.order.type === 'domain_registration' && paymentRecord.order.domainName) {
      try {
        const existingDomain = await domainRepository.findByName(paymentRecord.order.domainName);
        if (!existingDomain) {
          const domainName = paymentRecord.order.domainName;
          const parts = domainName.split('.');
          const tld = parts.slice(1).join('.');
          
          // Create the domain with DNS records
          const newDomain = await domainRepository.createWithDns({
            name: domainName, tld: '.' + parts.slice(1).join('.'), sld: parts[0],
            isFree: false, status: 'active', userId: paymentRecord.order.userId,
            orderId: paymentRecord.orderId, years: paymentRecord.order.years || 1,
          });
        }
        await db.order.update({ where: { id: paymentRecord.orderId }, data: { domainRegStatus: 'success', status: 'domain_registered' } });
        await db.notification.create({ data: { userId: paymentRecord.order.userId, title: 'Domain Registered Successfully', message: `Your domain ${paymentRecord.order.domainName} has been registered successfully and is now active.`, type: 'success' } });
      } catch (domainError: any) {
        await db.order.update({ where: { id: paymentRecord.orderId }, data: { domainRegStatus: 'failed', domainRegError: domainError.message } });
      }
    }

    // Create hosting environment for hosting orders
    if (paymentRecord.order.type === 'hosting' && paymentRecord.order.hostingPlanSlug && paymentRecord.order.domainName) {
      try {
        const domain = await db.domain.findFirst({ where: { name: paymentRecord.order.domainName, userId: paymentRecord.order.userId } });
        if (domain) {
          await db.hostingEnvironment.create({ data: { userId: paymentRecord.order.userId, domainId: domain.id, planSlug: paymentRecord.order.hostingPlanSlug, status: 'active', rootPath: `/home/fahad/hosting/users/${paymentRecord.order.userId}/${domain.name}`, serverType: 'static', sslEnabled: false, storageUsed: 0, storageLimit: 5368709120 } });
        }
      } catch {}
    }

    return { message: 'Payment approved successfully', payment: { id: paymentRecord.id, status: 'paid', verifiedAt: new Date() } };
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string, ip?: string) {
    if (!reason) return { error: 'Rejection reason is required', status: 400 };

    const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) return { error: 'Payment not found', status: 404 };
    if (payment.status === 'paid') return { error: 'Cannot reject an approved payment', status: 400 };
    if (payment.status === 'rejected') return { error: 'Payment is already rejected', status: 400 };

    await db.payment.update({ where: { id: paymentId }, data: { status: 'rejected', rejectionReason: reason } });
    await db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'rejected', status: 'failed', adminNotes: reason } });

    await paymentRepository.createPaymentLog({ paymentId: payment.id, action: 'rejected', details: JSON.stringify({ amount: payment.amount, trxId: payment.trxId, reason, rejectedBy: adminId }), performedBy: adminId, ipAddress: ip });
    await adminLogRepository.logAction({ adminId, action: 'payment_rejected', targetType: 'payment', targetId: payment.id, details: JSON.stringify({ orderId: payment.orderId, amount: payment.amount, trxId: payment.trxId, reason }), ipAddress: ip });
    await db.notification.create({ data: { userId: payment.userId, title: 'Payment Rejected', message: `Your payment (TRX: ${payment.trxId || 'N/A'}) for order #${payment.orderId.substring(0, 8)} has been rejected. Reason: ${reason}`, type: 'error' } });

    return { message: 'Payment rejected successfully', payment: { id: payment.id, status: 'rejected', rejectionReason: reason } };
  }
}

export const paymentService = new PaymentService();
