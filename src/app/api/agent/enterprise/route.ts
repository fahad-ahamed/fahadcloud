import { NextRequest, NextResponse } from 'next/server';
import { getEnterpriseEngine } from '@/lib/agent/enterprise';

// GET /api/agent/enterprise - Get enterprise analytics
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const enterprise = getEnterpriseEngine();

    const [sla, billing, analytics, report] = await Promise.all([
      enterprise.getSLAStatus(),
      enterprise.getBillingIntelligence(),
      enterprise.getInfrastructureAnalytics(),
      enterprise.generateInfrastructureReport(),
    ]);

    return NextResponse.json({ sla, billing, analytics, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

