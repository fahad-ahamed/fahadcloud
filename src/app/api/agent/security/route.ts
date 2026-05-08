import { NextRequest, NextResponse } from 'next/server';
import { getSecurityEngine } from '@/lib/agent/security';

// GET /api/agent/security - Get security status
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const security = getSecurityEngine();
    const status = security.getSecurityStatus();
    const firewall = security.getFirewallRecommendations();
    const secrets = security.generateSecretRotationPlan();

    return NextResponse.json({ status, firewall, secrets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/security - Security actions
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const body = await request.json();
    const { action, path } = body;

    const security = getSecurityEngine();

    switch (action) {
      case 'malware_scan': {
        const result = await security.scanForMalware(path || '/home/fahad/fahadcloud');
        return NextResponse.json(result);
      }
      case 'anomaly_detection': {
        const result = await security.detectAnomalies(userId);
        return NextResponse.json(result);
      }
      case 'validate_command': {
        const result = security.validateCommand(body.command || '', userId);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

