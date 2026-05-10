// @ts-nocheck
// ============ BUG DETECTION & AUTO FIX API ============
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogger } from '@/lib/audit-logger';
import { aiChat } from '@/lib/agent/ai-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const scanId = searchParams.get('scanId');

    if (scanId) {
      const scan = await db.bugScan.findUnique({ where: { id: scanId } });
      const bugs = await db.bugReport.findMany({ where: { scanId }, orderBy: { severity: 'desc' } });
      return NextResponse.json({ scan, bugs });
    }

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const bugs = await db.bugReport.findMany({ where, orderBy: { detectedAt: 'desc' }, take: 50 });
    const stats = await db.bugReport.groupBy({ by: ['severity'], _count: true });

    return NextResponse.json({ bugs, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, scope, targetPath, bugReportId } = body;

    if (action === 'scan') {
      return await startBugScan(userId, scope || 'quick', targetPath);
    }
    if (action === 'fix') {
      return await autoFixBug(bugReportId, userId);
    }
    if (action === 'rollback') {
      return await rollbackFix(bugReportId);
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function startBugScan(userId: string | undefined, scope: string, targetPath?: string) {
  const scan = await db.bugScan.create({ data: { userId, scope: scope as any, targetPath, status: 'running' } });

  (async () => {
    try {
      const scanResult = await aiChat([
          { role: 'system', content: 'You are a bug detection system. Output a JSON array of bugs. Each bug: {type, severity, description, filePath, suggestedFix}' },
          { role: 'user', content: `Perform a ${scope} bug scan of the Next.js project. Look for broken APIs, missing imports, dead code, security vulnerabilities, performance issues.` },
        ], { temperature: 0.2, maxTokens: 2000 });

      const content = scanResult.message || '[]';
      let bugs: any[] = [];
      try { const m = content.match(/\[[\s\S]*\]/); if (m) bugs = JSON.parse(m[0]); } catch {}

      let bugsFound = 0;
      for (const bug of bugs.slice(0, 15)) {
        try {
          await db.bugReport.create({
            data: {
              userId, type: bug.type || 'performance', severity: bug.severity || 'medium',
              status: 'detected', filePath: bug.filePath, description: bug.description || 'Issue detected',
              suggestedFix: bug.suggestedFix, detectorAgent: 'bug_detector', scanId: scan.id,
            },
          });
          bugsFound++;
        } catch {}
      }

      await db.bugScan.update({
        where: { id: scan.id },
        data: { status: 'completed', bugsFound, completedAt: new Date(), results: JSON.stringify(bugs) },
      });
    } catch (error: any) {
      await db.bugScan.update({ where: { id: scan.id }, data: { status: 'failed', fixResult: error.message } }).catch(() => {});
    }
  })();

  return NextResponse.json({ scanId: scan.id, status: 'running' });
}

async function autoFixBug(bugReportId: string, userId?: string) {
  const bug = await db.bugReport.findUnique({ where: { id: bugReportId } });
  if (!bug) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.bugReport.update({ where: { id: bugReportId }, data: { status: 'fixing', fixerAgent: 'auto_fix' } });

  (async () => {
    try {
      const fixResult = await aiChat([
          { role: 'system', content: 'Generate a code fix for this bug. Output only the fix.' },
          { role: 'user', content: `Bug: ${bug.description}\nType: ${bug.type}\nFile: ${bug.filePath || 'unknown'}\nSuggested: ${bug.suggestedFix || 'N/A'}` },
        ], { temperature: 0.2, maxTokens: 1500 });

      const appliedFix = fixResult.message || '';
      await db.bugReport.update({
        where: { id: bugReportId },
        data: { status: 'fixed', appliedFix, autoFixed: true, rollbackAvailable: true, rollbackData: bug.codeSnippet || '', fixedAt: new Date() },
      });
    } catch (error: any) {
      await db.bugReport.update({ where: { id: bugReportId }, data: { status: 'failed', fixResult: error.message } }).catch(() => {});
    }
  })();

  return NextResponse.json({ bugReportId, status: 'fixing' });
}

async function rollbackFix(bugReportId: string) {
  const bug = await db.bugReport.findUnique({ where: { id: bugReportId } });
  if (!bug) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!bug.rollbackAvailable) return NextResponse.json({ error: 'No rollback available' }, { status: 400 });

  await db.bugReport.update({
    where: { id: bugReportId },
    data: { status: 'detected', appliedFix: null, autoFixed: false, rollbackAvailable: false, fixedAt: null },
  });

  return NextResponse.json({ bugReportId, status: 'rolled_back' });
}
