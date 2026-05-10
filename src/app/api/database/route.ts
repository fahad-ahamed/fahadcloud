// ============ DATABASE DASHBOARD API ============
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRedisHealth } from '@/lib/redis';
import { checkQdrantHealth } from '@/lib/qdrant';
import { checkDatabaseHealth, BackupAutomation } from '@/lib/db-security';
import { queueManager } from '@/lib/queue';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Get all database health statuses
    const [pgHealth, redisHealth, qdrantHealth, queueStatus] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkQdrantHealth(),
      queueManager.getAllQueuesStatus().catch(() => ({})),
    ]);

    // Get table counts
    const [
      userCount, domainCount, agentSessionCount, agentMemoryCount,
      agentTaskCount, bugReportCount, knowledgeCount, learningSessionCount,
      auditLogCount, securityAlertCount, backupCount,
    ] = await Promise.all([
      db.user.count().catch(() => 0),
      db.domain.count().catch(() => 0),
      db.agentSession.count().catch(() => 0),
      db.agentMemory.count().catch(() => 0),
      db.agentTask.count().catch(() => 0),
      db.bugReport.count().catch(() => 0),
      db.knowledgeEntry.count().catch(() => 0),
      db.learningSession.count().catch(() => 0),
      db.auditLog.count().catch(() => 0),
      db.securityAlert.count({ where: { status: 'active' } }).catch(() => 0),
      db.databaseBackup.count({ where: { status: 'completed' } }).catch(() => 0),
    ]);

    // Get recent activity
    const recentAuditLogs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => []);

    const recentBugReports = await db.bugReport.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 10,
    }).catch(() => []);

    // Get Redis info
    const redisInfo = await redis.info('keyspace').catch(() => 'N/A');
    const redisMemory = await redis.info('memory').catch(() => 'N/A');
    const dbSize = await redis.dbsize().catch(() => 0);

    return NextResponse.json({
      databases: {
        postgresql: { ...pgHealth.postgresql, tables: { users: userCount, domains: domainCount, agentSessions: agentSessionCount, agentMemories: agentMemoryCount, agentTasks: agentTaskCount, bugReports: bugReportCount, knowledge: knowledgeCount, learningSessions: learningSessionCount } },
        redis: { ...redisHealth, dbSize, memoryUsage: redisMemory.match(/used_memory_human:(\S+)/)?.[1] || 'unknown' },
        qdrant: qdrantHealth,
      },
      security: {
        activeAlerts: securityAlertCount,
        totalAuditLogs: auditLogCount,
        completedBackups: backupCount,
      },
      queues: queueStatus,
      recentActivity: {
        auditLogs: recentAuditLogs,
        bugReports: recentBugReports,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'backup') {
      const result = await BackupAutomation.createBackup(body.type || 'manual', body.tables);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
