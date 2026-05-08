import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringEngine } from '@/lib/monitoring-engine';

// POST /api/agent/monitor/collect - Internal endpoint for cron metrics collection
export async function POST(request: NextRequest) {
  try {
    // Verify internal request via shared secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.JWT_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = getMonitoringEngine();
    await engine.recordMetrics();
    
    const metrics = engine.collectMetrics();
    const alerts = engine.checkAlerts(metrics);

    return NextResponse.json({ collected: true, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
