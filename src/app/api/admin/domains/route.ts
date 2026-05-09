import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { domainRepository, adminLogRepository } from '@/lib/repositories';
import { requireAdmin, getClientIp, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await domainRepository.searchDomains({ status, userId, search, page, limit });

    return NextResponse.json({
      domains: result.items.map(d => ({
        id: d.id,
        name: d.name,
        tld: d.tld,
        sld: d.sld,
        isFree: d.isFree,
        status: d.status,
        registeredAt: d.registeredAt,
        expiresAt: d.expiresAt,
        autoRenew: d.autoRenew,
        sslEnabled: d.sslEnabled,
        nameserver1: d.nameserver1,
        nameserver2: d.nameserver2,
        dnsRecordCount: d._count.dnsRecords,
        hostingEnv: d.hostingEnv,
        userId: d.userId,
        user: d.user,
        orderId: d.orderId,
        createdAt: d.createdAt,
      })),
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Admin domains error:', error);
    return NextResponse.json(
      { error: 'Failed to list domains' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { domainName, userId, years = 1, isFree = false } = body;

    if (!domainName || !userId) {
      return NextResponse.json(
        { error: 'Domain name and user ID are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const domainLower = domainName.toLowerCase().trim();
    const parts = domainLower.split('.');
    const tld = '.' + parts.slice(1).join('.');

    // Check if domain already exists
    const existingDomain = await domainRepository.findByName(domainLower);
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain is already registered' },
        { status: 409 }
      );
    }

    const domain = await domainRepository.createWithDns({
      name: domainLower,
      tld,
      sld: parts[0],
      isFree,
      status: 'active',
      userId,
      years,
    });

    const ip = getClientIp(request);

    // Log admin action
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'domain_registered_manual',
      targetType: 'domain',
      targetId: domain.id,
      details: JSON.stringify({
        domainName: domainLower,
        userId,
        isFree,
        years,
      }),
      ipAddress: ip,
    });

    return NextResponse.json({
      message: 'Domain registered successfully',
      domain,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Manual domain registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register domain' },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { domainId, status, autoRenew, sslEnabled, nameserver1, nameserver2, privacyProtect, locked } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const domain = await domainRepository.findById(domainId);
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      const validStatuses = ['active', 'expired', 'suspended', 'pending'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew;
    if (sslEnabled !== undefined) updateData.sslEnabled = sslEnabled;
    if (nameserver1 !== undefined) updateData.nameserver1 = nameserver1;
    if (nameserver2 !== undefined) updateData.nameserver2 = nameserver2;
    if (privacyProtect !== undefined) updateData.privacyProtect = privacyProtect;
    if (locked !== undefined) updateData.locked = locked;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await db.domain.update({
      where: { id: domainId },
      data: updateData,
    });

    const ip = getClientIp(request);
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'domain_updated',
      targetType: 'domain',
      targetId: domainId,
      details: JSON.stringify({ domainName: domain.name, updates: updateData }),
      ipAddress: ip,
    });

    return NextResponse.json({ message: 'Domain updated successfully', domain: updated });
  } catch (error: any) {
    console.error('Admin update domain error:', error);
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json(
        { error: 'domainId parameter is required' },
        { status: 400 }
      );
    }

    const domain = await domainRepository.findById(domainId);
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    await domainRepository.deleteWithDns(domainId);

    const ip = getClientIp(request);

    // Log admin action
    await adminLogRepository.logAction({
      adminId: auth.user!.userId,
      action: 'domain_deleted',
      targetType: 'domain',
      targetId: domainId,
      details: JSON.stringify({
        domainName: domain.name,
        userId: domain.userId,
      }),
      ipAddress: ip,
    });

    return NextResponse.json({ message: 'Domain deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete domain error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
