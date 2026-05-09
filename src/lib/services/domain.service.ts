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
    
    // Handle TLD appending
    if (data.tld && !domainName.includes('.')) {
      const tldClean = data.tld.replace(/^\./, '');
      domainName = domainName + '.' + tldClean;
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
      // Register free domain immediately
      const domain = await domainRepository.createWithDns({
        name: domainLower, tld, sld, isFree: true, status: 'active', userId, years: data.years || 1,
      });

      // Create hosting directory for the domain
      try {
        const fs = require('fs');
        const hostDir = '/home/fahad/hosting/users/' + userId + '/' + domainLower;
        fs.mkdirSync(hostDir, { recursive: true });
        
        // Create a default index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${domainLower}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; color: white; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 2rem; margin-top: 1rem; }
    a { color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome!</h1>
    <p>Your domain <strong>${domainLower}</strong> is now active.</p>
    <p>Powered by FahadCloud</p>
    <div class="badge">Deploy your site via the <a href="/">FahadCloud Dashboard</a></div>
  </div>
</body>
</html>`;
        fs.writeFileSync(hostDir + '/index.html', indexHtml);
      } catch (e: any) {
        console.error('Hosting dir creation error:', e.message);
      }

      // Create DNS zone file
      try {
        const { getDnsEngine } = await import('@/lib/dns-engine');
        getDnsEngine().writeZoneFile(domainLower, [
          { type: 'A', name: '@', value: '52.201.210.162', ttl: 3600 },
          { type: 'A', name: 'www', value: '52.201.210.162', ttl: 3600 },
        ]);
      } catch (e: any) {
        console.error('DNS zone creation error:', e.message);
      }

      // Create hosting environment entry in database
      try {
        await db.hostingEnvironment.create({
          data: {
            userId,
            domainId: domain.id,
            planSlug: 'starter',
            status: 'active',
            rootPath: '/home/fahad/hosting/users/' + userId + '/' + domainLower,
            serverType: 'static',
            sslEnabled: false,
            storageUsed: 0,
            storageLimit: 1073741824, // 1GB
          },
        });
      } catch (e: any) {
        console.error('Hosting env creation error:', e.message);
      }

      // Create notification for user
      try {
        await db.notification.create({
          data: {
            userId,
            title: 'Domain Registered Successfully!',
            message: `Your free domain ${domainLower} has been registered and is now active. You can deploy your website using the Deploy section.`,
            type: 'success',
          },
        });
      } catch (e: any) {
        console.error('Notification error:', e.message);
      }

      return { message: 'Free domain registered successfully', domain, isFree: true, status: 201 };
    } else {
      // Paid domain - create order for payment
      const tldPricing = await db.tldPricing.findFirst({
        where: {
          OR: [
            { tld: '.' + tld },
            { tld: tld },
          ]
        }
      });
      
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

    // Delete hosting environment if exists
    try {
      const hostingEnv = await db.hostingEnvironment.findUnique({ where: { domainId: domainId } });
      if (hostingEnv) {
        await db.hostingEnvironment.delete({ where: { id: hostingEnv.id } });
      }
    } catch (e: any) {
      console.error('Hosting env delete error:', e.message);
    }

    await domainRepository.deleteWithDns(domainId);
    return { message: 'Domain deleted successfully' };
  }
}

export const domainService = new DomainService();
