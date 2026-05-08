import { db } from '@/lib/db';
import { domainRepository } from '@/lib/repositories';
import { usdToBdt } from '@/lib/bkash';

const FREE_TLDS = ['fahadcloud.com', 'tk', 'ml', 'ga', 'cf', 'eu.org', 'pp.ua'];

export class DomainService {
  async listUserDomains(userId: string) {
    const domains = await domainRepository.findByUserId(userId);
    return domains.map(d => ({
      id: d.id, name: d.name, tld: d.tld, sld: d.sld, isFree: d.isFree,
      status: d.status, registeredAt: d.registeredAt, expiresAt: d.expiresAt,
      autoRenew: d.autoRenew, sslEnabled: d.sslEnabled,
      nameserver1: d.nameserver1, nameserver2: d.nameserver2,
      _count: { dnsRecords: d._count.dnsRecords }, createdAt: d.createdAt,
    }));
  }

  async registerDomain(userId: string, data: { domainName?: string; name?: string; tld?: string; isFree?: boolean; years?: number; hostingPlanSlug?: string }) {
    let domainName = data.domainName || data.name || '';
    if (data.tld && !domainName.includes('.')) {
      domainName = domainName + '.' + data.tld.replace(/^\./, '');
    }
    if (!domainName || !domainName.includes('.')) {
      return { error: 'Domain name is required (e.g., mysite.fahadcloud.com or mysite.com)', status: 400 };
    }

    const domainLower = domainName.toLowerCase().trim().replace(/[^a-z0-9.-]/g, '');
    const parts = domainLower.split('.');
    const sld = parts[0];
    const tld = parts.slice(1).join('.');

    const existingDomain = await domainRepository.findByName(domainLower);
    if (existingDomain) return { error: 'Domain is already registered', status: 409 };

    const isFree = data.isFree !== undefined ? data.isFree : FREE_TLDS.includes(tld);

    if (isFree) {
      const domain = await domainRepository.createWithDns({
        name: domainLower, tld, sld, isFree: true, status: 'domain_registered', userId, years: data.years,
      });

      try {
        const fs = require('fs');
        fs.mkdirSync('/home/fahad/hosting/users/' + userId + '/' + domainLower, { recursive: true });
      } catch {}

      try {
        const { getDnsEngine } = await import('@/lib/dns-engine');
        getDnsEngine().writeZoneFile(domainLower, [
          { type: 'A', name: '@', value: '52.201.210.162', ttl: 3600 },
          { type: 'A', name: 'www', value: '52.201.210.162', ttl: 3600 },
        ]);
      } catch {}

      return { message: 'Free domain registered successfully', domain, isFree: true, status: 201 };
    } else {
      const tldPricing = await db.tldPricing.findUnique({ where: { tld } });
      if (!tldPricing) return { error: `Pricing not available for .${tld}. Please contact support.`, status: 400 };

      const registerPrice = tldPricing.promo && tldPricing.promoPrice ? tldPricing.promoPrice : tldPricing.registerPrice;
      const totalPrice = registerPrice * (data.years || 1);
      const totalPriceBDT = usdToBdt(totalPrice);

      const order = await db.order.create({
        data: {
          userId, type: 'domain_registration',
          description: `Domain registration: ${domainLower} for ${data.years || 1} year(s)`,
          amount: totalPriceBDT, status: 'pending', paymentStatus: 'unpaid',
          domainName: domainLower, tld, years: data.years || 1, isFreeDomain: false,
          hostingPlanSlug: data.hostingPlanSlug || null,
          items: JSON.stringify({ domainName: domainLower, tld, years: data.years || 1, pricePerYear: registerPrice, totalPrice, totalPriceBDT }),
        },
      });

      return {
        message: 'Order created for paid domain registration',
        order: { id: order.id, amount: order.amount, status: order.status, paymentStatus: order.paymentStatus, domainName: order.domainName, createdAt: order.createdAt },
        isFree: false,
        pricing: { pricePerYearUSD: registerPrice, totalPriceUSD: totalPrice, totalPriceBDT, years: data.years || 1 },
        status: 201,
      };
    }
  }

  async deleteDomain(domainId: string, userId: string, userRole: string) {
    const domain = await domainRepository.findById(domainId);
    if (!domain) return { error: 'Domain not found', status: 404 };
    if (domain.userId !== userId && userRole !== 'admin') return { error: 'Access denied', status: 403 };

    await domainRepository.deleteWithDns(domainId);
    return { message: 'Domain deleted successfully' };
  }
}

export const domainService = new DomainService();
