import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domainId');
    const domainName = searchParams.get('domain');

    if (!domainId && !domainName) {
      return NextResponse.json(
        { error: 'domainId or domain parameter is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (domainId) {
      where.id = domainId;
    } else {
      where.name = domainName;
    }

    const domain = await db.domain.findFirst({
      where,
      include: { dnsRecords: true },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (domain.userId !== currentUser.userId && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      domain: {
        id: domain.id,
        name: domain.name,
        status: domain.status,
      },
      records: domain.dnsRecords.map(r => ({
        id: r.id,
        type: r.type,
        name: r.name,
        value: r.value,
        ttl: r.ttl,
        priority: r.priority,
        proxied: r.proxied,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get DNS records error:', error);
    return NextResponse.json(
      { error: 'Failed to get DNS records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { domainId, type, name, value, ttl, priority, proxied } = body;

    if (!domainId || !type || !name || !value) {
      return NextResponse.json(
        { error: 'domainId, type, name, and value are required' },
        { status: 400 }
      );
    }

    const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'];
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid record type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const domain = await db.domain.findUnique({ where: { id: domainId } });
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (domain.userId !== currentUser.userId && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const dnsRecord = await db.dnsRecord.create({
      data: {
        domainId,
        type: type.toUpperCase(),
        name,
        value,
        ttl: ttl || 3600,
        priority: priority || null,
        proxied: proxied || false,
      },
    });

    // Write zone file for real DNS resolution
    try {
      const { getDnsEngine } = await import('@/lib/dns-engine');
      const dnsEngine = getDnsEngine();
      const allRecords = await db.dnsRecord.findMany({ where: { domainId } });
      dnsEngine.writeZoneFile(domain.name, allRecords.map(r => ({
        type: r.type, name: r.name, value: r.value, ttl: r.ttl, priority: r.priority || undefined,
      })));
    } catch (e: any) {
      console.error('DNS zone file write failed:', e.message);
    }

    return NextResponse.json({
      message: 'DNS record added successfully',
      record: dnsRecord,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add DNS record error:', error);
    return NextResponse.json(
      { error: 'Failed to add DNS record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { recordId, type, name, value, ttl, priority, proxied } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
        { status: 400 }
      );
    }

    const existingRecord = await db.dnsRecord.findUnique({
      where: { id: recordId },
      include: { domain: true },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'DNS record not found' }, { status: 404 });
    }

    if (existingRecord.domain.userId !== currentUser.userId && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: any = {};
    if (type) {
      const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'];
      if (!validTypes.includes(type.toUpperCase())) {
        return NextResponse.json(
          { error: `Invalid record type. Valid types: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.type = type.toUpperCase();
    }
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = value;
    if (ttl !== undefined) updateData.ttl = ttl;
    if (priority !== undefined) updateData.priority = priority;
    if (proxied !== undefined) updateData.proxied = proxied;

    const updatedRecord = await db.dnsRecord.update({
      where: { id: recordId },
      data: updateData,
    });

    // Update zone file for real DNS resolution
    try {
      const { getDnsEngine } = await import('@/lib/dns-engine');
      const dnsEngine = getDnsEngine();
      const domainId = existingRecord.domainId;
      const domain = await db.domain.findUnique({ where: { id: domainId } });
      if (domain) {
        const allRecords = await db.dnsRecord.findMany({ where: { domainId } });
        dnsEngine.writeZoneFile(domain.name, allRecords.map(r => ({
          type: r.type, name: r.name, value: r.value, ttl: r.ttl, priority: r.priority || undefined,
        })));
      }
    } catch (e: any) {
      console.error('DNS zone file update failed:', e.message);
    }

    return NextResponse.json({
      message: 'DNS record updated successfully',
      record: updatedRecord,
    });
  } catch (error: any) {
    console.error('Update DNS record error:', error);
    return NextResponse.json(
      { error: 'Failed to update DNS record' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId parameter is required' },
        { status: 400 }
      );
    }

    const existingRecord = await db.dnsRecord.findUnique({
      where: { id: recordId },
      include: { domain: true },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'DNS record not found' }, { status: 404 });
    }

    if (existingRecord.domain.userId !== currentUser.userId && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.dnsRecord.delete({ where: { id: recordId } });

    // Update zone file after deletion
    try {
      const { getDnsEngine } = await import('@/lib/dns-engine');
      const dnsEngine = getDnsEngine();
      const domainId = existingRecord.domainId;
      const domain = await db.domain.findUnique({ where: { id: domainId } });
      if (domain) {
        const allRecords = await db.dnsRecord.findMany({ where: { domainId } });
        dnsEngine.writeZoneFile(domain.name, allRecords.map(r => ({
          type: r.type, name: r.name, value: r.value, ttl: r.ttl, priority: r.priority || undefined,
        })));
      }
    } catch (e: any) {
      console.error('DNS zone file update after delete failed:', e.message);
    }

    return NextResponse.json({ message: 'DNS record deleted successfully' });
  } catch (error: any) {
    console.error('Delete DNS record error:', error);
    return NextResponse.json(
      { error: 'Failed to delete DNS record' },
      { status: 500 }
    );
  }
}
