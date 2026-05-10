// ============ AUDIT LOG & SECURITY API ============
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogger } from '@/lib/audit-logger';
import { BackupAutomation, APIRateLimiter } from '@/lib/db-security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logs';

    if (type === 'alerts') {
      const alerts = await auditLogger.getSecurityAlerts(searchParams.get('status') || undefined, parseInt(searchParams.get('limit') || '20'));
      return NextResponse.json({ alerts });
    }

    if (type === 'backups') {
      const backups = await BackupAutomation.listBackups(parseInt(searchParams.get('limit') || '20'));
      return NextResponse.json({ backups });
    }

    if (type === 'stats') {
      const [totalLogs, activeAlerts, completedBackups, logsByCategory] = await Promise.all([
        db.auditLog.count().catch(() => 0),
        db.securityAlert.count({ where: { status: 'active' } }).catch(() => 0),
        db.databaseBackup.count({ where: { status: 'completed' } }).catch(() => 0),
        db.auditLog.groupBy({ by: ['category'], _count: true }).catch(() => []),
      ]);
      return NextResponse.json({ totalLogs, activeAlerts, completedBackups, logsByCategory });
    }

    const result = await auditLogger.getLogs({
      userId: searchParams.get('userId') || undefined,
      category: (searchParams.get('category') as any) || undefined,
      action: searchParams.get('action') || undefined,
      riskLevel: (searchParams.get('riskLevel') as any) || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'backup') {
      const result = await BackupAutomation.createBackup(body.type || 'manual', body.tables);
      return NextResponse.json(result);
    }

    if (action === 'resolve_alert') {
      const alert = await db.securityAlert.update({
        where: { id: body.alertId },
        data: { status: 'resolved', resolvedBy: body.userId, resolvedAt: new Date() },
      });
      return NextResponse.json({ alert });
    }

    if (action === 'check_rate_limit') {
      const result = await APIRateLimiter.checkLimit(body.identifier, body.action, body.maxRequests || 100, body.windowSeconds || 60);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
