import { NextRequest, NextResponse } from 'next/server';
import { validateShellCommand, getSandboxEnv, getSandboxCwd, getAdminHelpText, getUserHelpText } from '@/lib/shell-sandbox';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod');
    let payload: any;
    try { payload = (await jwtVerify(token, secret)).payload; } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const userId = payload.userId as string;
    const userEmail = payload.email as string;
    const userRole = payload.role as string;

    // Check if user is blocked
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true, adminRole: true } });
    if (!user || user.role === 'blocked') {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const isAdmin = user.role === 'admin' || user.adminRole === 'super_admin' || user.email === 'admin@fahadcloud.com' || user.email === 'fahadcloud24@gmail.com';

    const body = await request.json();
    const { command } = body;

    if (!command) return NextResponse.json({ error: 'Command required' }, { status: 400 });

    // Log the terminal command to user activity
    try {
      await db.userActivityLog.create({
        data: {
          userId,
          action: 'terminal_command',
          category: 'terminal',
          details: JSON.stringify({ command: command.substring(0, 200), isAdmin }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        }
      });
    } catch {}

    // Handle built-in commands
    if (command === 'help') {
      return NextResponse.json({
        output: isAdmin ? getAdminHelpText() : getUserHelpText(),
        exitCode: 0,
        isAdmin,
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
AI Agents: 14 active
Orchestrator: Online
Memory: Active
Access Level: ${isAdmin ? 'ADMIN (Full)' : 'USER (Restricted)'}`,
          exitCode: 0,
          isAdmin,
        });
      } catch {
        return NextResponse.json({ output: 'AI Status: System online', exitCode: 0, isAdmin });
      }
    }

    // Validate command against sandbox rules based on role
    const validation = validateShellCommand(command, isAdmin, userId);
    if (!validation.safe) {
      return NextResponse.json({
        output: `⛔ Command blocked: ${validation.reason}`,
        exitCode: 126,
        riskLevel: validation.riskLevel,
        isAdmin,
      });
    }

    // Determine working directory based on role
    const cwd = isAdmin ? '/home/fahad' : getSandboxCwd(userId, false);
    const env = isAdmin ? getSandboxEnv(userId, true) : getSandboxEnv(userId, false);

    // Ensure user directory exists
    if (!isAdmin) {
      try { require('fs').mkdirSync(cwd, { recursive: true }); } catch {}
    }

    const startTime = Date.now();
    let output = '';
    let exitCode = 0;

    try {
      const { execSync } = require('child_process');
      
      // For admin users, use full shell with sudo capability
      if (isAdmin) {
        output = execSync(validation.sanitized!, {
          timeout: 30000,
          maxBuffer: 1024 * 1024,
          encoding: 'utf-8',
          cwd,
          env: { ...process.env, ...env },
        }) || '';
      } else {
        // For regular users, restrict to their directory
        // Prepend cd to user's directory for safety
        const safeCommand = `cd ${cwd} 2>/dev/null; ${validation.sanitized!}`;
        output = execSync(safeCommand, {
          timeout: 15000,
          maxBuffer: 512 * 1024,
          encoding: 'utf-8',
          cwd,
          env: { ...env, HOME: cwd },
        }) || '';
      }
    } catch (error: any) {
      output = (error.stdout || '') + (error.stderr ? '\n' + error.stderr : '') || error.message;
      exitCode = error.status || 1;
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({ 
      output: output.substring(0, 10000), 
      exitCode, 
      duration, 
      riskLevel: validation.riskLevel,
      isAdmin,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
