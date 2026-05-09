import { ActivityLog } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';
import { domainService } from '@/lib/services';
import { requireAuth, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const domains = await domainService.listUserDomains(auth.user!.userId);

    return NextResponse.json({ domains });
  } catch (error: any) {
    console.error('List domains error:', error);
    return NextResponse.json({ error: 'Failed to list domains' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { domainName: bodyDomainName, name: bodyName, tld: bodyTld, isFree: bodyIsFree, years = 1, hostingPlanSlug } = body;

    const result = await domainService.registerDomain(auth.user!.userId, {
      domainName: bodyDomainName,
      name: bodyName,
      tld: bodyTld,
      isFree: bodyIsFree,
      years,
      hostingPlanSlug,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    // domainService returns status as a property, extract it
    const { status: _statusCode, ...responseData } = result;
    return NextResponse.json(responseData, { status: result.status || 201 });
  } catch (error: any) {
    console.error('Domain registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to register domain' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const domainId = body.domainId || body.id;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    const result = await domainService.deleteDomain(domainId, auth.user!.userId, auth.user!.role);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Delete domain error:', error);
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
}
