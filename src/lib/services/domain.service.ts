import { db } from '@/lib/db';
import { domainRepository } from '@/lib/repositories';
import { appConfig } from '@/lib/config/app.config';

// ========== ALL DOMAINS ARE FREE - FAHADCLOUD ==========
// Every domain registers instantly without payment

export class DomainService {
  async listUserDomains(userId: string) {
    const domains = await domainRepository.findByUserId(userId);
    return domains.map(d => ({
      id: d.id, name: d.name, tld: d.tld, sld: d.sld, isFree: true,
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

    // ALL DOMAINS REGISTER FREE INSTANTLY
    const domain = await domainRepository.createWithDns({
      name: domainLower, tld, sld, isFree: true, status: 'active', userId, years: data.years || 1,
    });

    // Create hosting directory for the domain
    try {
      const fs = require('fs');
      const hostDir = appConfig.hosting.usersDir + '/' + userId + '/' + domainLower;
      fs.mkdirSync(hostDir, { recursive: true });
      
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
    .free-badge { background: rgba(255,255,255,0.3); font-weight: bold; font-size: 1.1rem; }
    a { color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome!</h1>
    <p>Your domain <strong>${domainLower}</strong> is now active.</p>
    <p>Powered by FahadCloud</p>
    <div class="badge free-badge">100% FREE - Unlimited Everything</div>
    <div class="badge" style="margin-top:1.5rem">Deploy your site via the <a href="/">FahadCloud Dashboard</a></div>
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
        { type: 'A', name: '@', value: appConfig.serverIp, ttl: 3600 },
        { type: 'A', name: 'www', value: appConfig.serverIp, ttl: 3600 },
      ]);
    } catch (e: any) {
      console.error('DNS zone creation error:', e.message);
    }

    // Create hosting environment entry in database with UNLIMITED storage
    try {
      await db.hostingEnvironment.create({
        data: {
          userId,
          domainId: domain.id,
          planSlug: data.hostingPlanSlug || 'enterprise',
          status: 'active',
          rootPath: appConfig.hosting.usersDir + '/' + userId + '/' + domainLower,
          serverType: 'static',
          sslEnabled: false,
          storageUsed: 0,
          storageLimit: 107374182400, // 100GB - FREE
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
          title: 'Domain Registered Successfully - FREE!',
          message: `Your domain ${domainLower} has been registered for FREE and is now active. You have unlimited storage and all features enabled. Deploy your website now!`,
          type: 'success',
        },
      });
    } catch (e: any) {
      console.error('Notification error:', e.message);
    }

    return { message: 'Domain registered successfully for FREE!', domain, isFree: true, status: 201 };
  }

  async deleteDomain(domainId: string, userId: string, userRole: string) {
    const domain = await domainRepository.findById(domainId);
    if (!domain) return { error: 'Domain not found', status: 404 };
    if (domain.userId !== userId && userRole !== 'admin') return { error: 'Access denied', status: 403 };

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
