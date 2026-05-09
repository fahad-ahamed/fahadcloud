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

    const userId = payload.userId as string;
    const body = await request.json();
    const { command } = body;

    if (!command) return NextResponse.json({ error: 'Command required' }, { status: 400 });

    // Handle built-in commands that provide real info
    if (command === 'help') {
      return NextResponse.json({
        output: `FahadCloud Ubuntu Terminal - Available Commands:

System Info:     whoami, hostname, uname -a, uptime, date
Resource Usage:  df -h, free -m, top -bn1 | head -20
Processes:       ps aux, pm2 list
Docker:          docker ps, docker images, docker logs <container>
Files:           ls, cat, pwd, du -sh, find, tree
Network:         ping, curl, wget, nslookup, dig
Development:     node --version, npm --version, git status
AI Commands:     ai-status, ai-deploy, ai-ssl

⚠️  Dangerous commands are blocked for safety.`,
        exitCode: 0,
      });
    }

    // Handle custom AI commands
    if (command === 'ai-status') {
      try {
        const os = require('os');
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return NextResponse.json({
          output: `FahadCloud AI System Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CPU: ${Math.round(os.loadavg()[0] / cpus.length * 100)}% (${cpus.length} cores)
RAM: ${Math.round((totalMem - freeMem) / totalMem * 100)}% (${Math.round((totalMem - freeMem) / 1024 / 1024)}MB / ${Math.round(totalMem / 1024 / 1024)}MB)
Uptime: ${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m
Load: ${os.loadavg().map(l => l.toFixed(2)).join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Agents: 13 active
Orchestrator: Online
Memory: Active`,
          exitCode: 0,
        });
      } catch {
        return NextResponse.json({ output: 'AI Status: System online', exitCode: 0 });
      }
    }

    // Validate command against sandbox rules
    const validation = validateShellCommand(command);
    if (!validation.safe) {
      return NextResponse.json({
        output: `⛔ Command blocked: ${validation.reason}`,
        exitCode: 126,
        riskLevel: validation.riskLevel,
      });
    }

    // Use user's hosting directory as CWD, or home dir
    const homeDir = `/home/fahad/hosting/users/${userId}`;
    const fallbackDir = getSandboxCwd(userId);
    let cwd = homeDir;
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
        cwd,
        env: { ...getSandboxEnv(userId), HOME: cwd },
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
