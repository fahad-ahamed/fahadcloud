import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateShellCommand, getSandboxEnv, getSandboxCwd } from '@/lib/shell-sandbox';



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
    const { command, sessionId } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const validation = validateShellCommand(command);
    
    if (!validation.safe) {
      await db.agentToolExecution.create({
        data: { userId, sessionId, tool: 'shell_execute', input: JSON.stringify({ command }), status: 'denied', riskLevel: validation.riskLevel },
      }).catch(() => {});
      return NextResponse.json({ error: 'Command rejected for security reasons', reason: validation.reason, riskLevel: validation.riskLevel }, { status: 403 });
    }

    const recentExecutions = await db.agentToolExecution.count({
      where: { userId, tool: 'shell_execute', createdAt: { gte: new Date(Date.now() - 60000) } },
    });
    if (recentExecutions >= 10) {
      return NextResponse.json({ error: 'Rate limit: max 10 commands/min' }, { status: 429 });
    }

    const homeDir = getSandboxCwd(userId);

    let output = '';
    let exitCode = 0;
    const startTime = Date.now();

    try {
      const nativeReq = typeof require !== 'undefined' ? require : null;
      if (nativeReq) {
        const cp = nativeReq('child_process');
        const fs = nativeReq('fs');
        try { fs.mkdirSync(homeDir, { recursive: true }); } catch {}
        const result = cp.execSync(validation.sanitized!, {
          timeout: 15000,
          maxBuffer: 512 * 1024,
          encoding: 'utf-8',
          cwd: homeDir,
          env: { ...getSandboxEnv(userId) },
        });
        output = result || 'OK';
      } else {
        output = 'Shell execution not available in this environment';
        exitCode = 1;
      }
    } catch (error: any) {
      if (error.stdout) output = error.stdout;
      if (error.stderr) output += (output ? '\n' : '') + error.stderr;
      if (!output) output = error.message;
      exitCode = error.status || 1;
    }

    const duration = Date.now() - startTime;

    await db.agentToolExecution.create({
      data: {
        userId, sessionId, tool: 'shell_execute',
        input: JSON.stringify({ command }),
        output: JSON.stringify({ output: output.substring(0, 5000), exitCode }),
        status: exitCode === 0 ? 'executed' : 'failed',
        riskLevel: validation.riskLevel, executedAt: new Date(), duration,
      },
    }).catch(() => {});

    return NextResponse.json({ output: output.substring(0, 10000), exitCode, duration, riskLevel: validation.riskLevel, sanitized: validation.sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

