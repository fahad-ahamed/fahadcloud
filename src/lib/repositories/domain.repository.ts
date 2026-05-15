import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';
import { appConfig } from '@/lib/config/app.config';

export class DomainRepository extends BaseRepository<any> {
  protected model = db.domain;

  async findByName(name: string) {
    return db.domain.findUnique({ where: { name: name.toLowerCase() } });
  }

  async findByUserId(userId: string) {
    return db.domain.findMany({
      where: { userId },
      include: { _count: { select: { dnsRecords: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithDnsRecords(domainId: string) {
    return db.domain.findUnique({
      where: { id: domainId },
      include: { dnsRecords: true },
    });
  }

  async createWithDns(data: { name: string; tld: string; sld: string; isFree: boolean; status: string; userId: string; orderId?: string; years?: number }) {
    const SERVER_IP = appConfig.serverIp;
    const expiresAt = new Date(Date.now() + (data.years || 1) * 365 * 24 * 60 * 60 * 1000);
    return db.domain.create({
      data: {
        name: data.name,
        tld: data.tld,
        sld: data.sld,
        isFree: data.isFree,
        status: data.status,
        registeredAt: new Date(),
        expiresAt,
        autoRenew: true,
        nameserver1: 'ns1.fahadcloud.com',
        nameserver2: 'ns2.fahadcloud.com',
        dnsZoneConfigured: true,
        orderId: data.orderId || null,
        userId: data.userId,
        dnsRecords: {
          create: [
            { type: 'A', name: '@', value: SERVER_IP, ttl: 3600 },
            { type: 'A', name: 'www', value: SERVER_IP, ttl: 3600 },
            { type: 'CNAME', name: 'ftp', value: data.name, ttl: 3600 },
            { type: 'MX', name: '@', value: `mail.${data.name}`, ttl: 3600, priority: 10 },
            { type: 'TXT', name: '@', value: 'v=spf1 include:fahadcloud.com ~all', ttl: 3600 },
          ],
        },
      },
      include: { dnsRecords: true },
    });
  }

  async deleteWithDns(domainId: string) {
    await db.dnsRecord.deleteMany({ where: { domainId } });
    return db.domain.delete({ where: { id: domainId } });
  }

  async searchDomains(params: { status?: string; userId?: string; search?: string; page?: number; limit?: number }) {
    const { status, userId, search, page = 1, limit = 20 } = params;
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sld: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }
    return this.paginate({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { dnsRecords: true } },
        hostingEnv: { select: { id: true, status: true, planSlug: true } },
      },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
    });
  }
}

export const domainRepository = new DomainRepository();
