import { NextRequest, NextResponse } from 'next/server';
import { validateShellCommand, getSandboxEnv, getSandboxCwd } from '@/lib/shell-sandbox';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    // Only allow admin to use shell
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Shell access requires admin privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { command } = body;
    
    if (!command) return NextResponse.json({ error: 'Command required' }, { status: 400 });

    // Validate command against sandbox rules
    const validation = validateShellCommand(command);
    if (!validation.safe) {
      return NextResponse.json({ 
        output: `Command blocked: ${validation.reason}`, 
        exitCode: 126, 
        riskLevel: validation.riskLevel 
      });
    }

    const homeDir = getSandboxCwd(payload.userId);
    try { require('fs').mkdirSync(homeDir, { recursive: true }); } catch {}
    
    const startTime = Date.now();
    let output = '';
    let exitCode = 0;
    
    try {
      const { execSync } = require('child_process');
      output = execSync(validation.sanitized!, {
        timeout: 15000,
        maxBuffer: 512 * 1024,
        encoding: 'utf-8',
        cwd: homeDir,
        env: { ...getSandboxEnv(payload.userId) },
      }) || '';
    } catch (error: any) {
      output = (error.stdout || '') + (error.stderr ? '\n' + error.stderr : '') || error.message;
      exitCode = error.status || 1;
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({ output: output.substring(0, 10000), exitCode, duration, riskLevel: validation.riskLevel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

