import { NextRequest, NextResponse } from 'next/server';
import { getInfrastructureEngine } from '@/lib/agent/infrastructure';

// GET /api/agent/infrastructure - Get infrastructure status
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const infra = getInfrastructureEngine();
    const [containers, cluster, network, proxy] = await Promise.all([
      infra.listContainers(),
      Promise.resolve(infra.getClusterStatus()),
      Promise.resolve(infra.getNetworkConfig()),
      Promise.resolve(infra.getReverseProxyConfig()),
    ]);

    return NextResponse.json({ containers, cluster, network, proxy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent/infrastructure - Infrastructure actions
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode('fahadcloud-secret-key-2024-secure-prod-v2');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const body = await request.json();
    const { action } = body;
    const infra = getInfrastructureEngine();

    switch (action) {
      case 'generate_iac': {
        const config = infra.generateIaC(body.type || 'docker-compose');
        return NextResponse.json({ config, type: body.type });
      }
      case 'replicate_env': {
        const result = await infra.replicateEnvironment(body.sourceEnvId, body.targetName);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

