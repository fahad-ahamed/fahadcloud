import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin, authErrorResponse, getClientIp } from '@/lib/middleware';
import { adminLogRepository } from '@/lib/repositories';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = '/home/fahad/fahadcloud';

// GET /api/admin/system?action=status|logs|env|services|db-stats|pm2|disk
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const os = require('os');
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const loadAvg = os.loadavg();
      
      let pm2Status = '';
      let dockerStatus = '';
      let nginxStatus = '';
      let diskUsage = '';
      
      try { pm2Status = execSync('pm2 jlist 2>/dev/null || echo "[]"', { timeout: 5000, encoding: 'utf-8' }); } catch {}
      try { dockerStatus = execSync('docker ps --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "Docker not running"', { timeout: 5000, encoding: 'utf-8' }); } catch {}
      try { nginxStatus = execSync('systemctl is-active nginx 2>/dev/null || echo "unknown"', { timeout: 5000, encoding: 'utf-8' }); } catch {}
      try { diskUsage = execSync('df -h / 2>/dev/null | tail -1', { timeout: 5000, encoding: 'utf-8' }); } catch {}

      return NextResponse.json({
        cpu: { cores: cpus.length, model: cpus[0]?.model || 'Unknown', loadAvg },
        memory: { total: totalMem, free: freeMem, used: totalMem - freeMem, percentage: Math.round((totalMem - freeMem) / totalMem * 100) },
        uptime: os.uptime(),
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        pm2: pm2Status.substring(0, 2000),
        docker: dockerStatus.trim(),
        nginx: nginxStatus.trim(),
        disk: diskUsage.trim(),
      });
    }

    if (action === 'logs') {
      const service = searchParams.get('service') || 'fahadcloud';
      const lines = searchParams.get('lines') || '50';
      let logs = '';
      try {
        if (service === 'nginx-access') {
          logs = execSync(`tail -${lines} /var/log/nginx/access.log 2>/dev/null || echo "No access log"`, { timeout: 5000, encoding: 'utf-8' });
        } else if (service === 'nginx-error') {
          logs = execSync(`tail -${lines} /var/log/nginx/error.log 2>/dev/null || echo "No error log"`, { timeout: 5000, encoding: 'utf-8' });
        } else {
          logs = execSync(`pm2 logs ${service} --lines ${lines} --nostream 2>&1`, { timeout: 10000, encoding: 'utf-8' });
        }
      } catch (e: any) {
        logs = e.stdout || e.message || 'Failed to read logs';
      }
      return NextResponse.json({ logs: logs.substring(0, 50000), service });
    }

    if (action === 'env') {
      // Read .env file
      const envPath = path.join(PROJECT_ROOT, '.env');
      if (!fs.existsSync(envPath)) {
        return NextResponse.json({ error: '.env file not found' }, { status: 404 });
      }
      const envContent = fs.readFileSync(envPath, 'utf-8');
      // Mask sensitive values
      const maskedContent = envContent.split('\n').map(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'SMTP_PASS', 'BKASH'];
          if (sensitiveKeys.some(k => key.toUpperCase().includes(k))) {
            return `${key}=****`;
          }
          return line;
        }
        return line;
      }).join('\n');
      return NextResponse.json({ env: maskedContent });
    }

    if (action === 'services') {
      const services = ['nginx', 'docker', 'pm2-fahadcloud'];
      const statusMap: any = {};
      for (const svc of services) {
        try {
          if (svc === 'pm2-fahadcloud') {
            const result = execSync('pm2 describe fahadcloud 2>/dev/null | grep -E "status|uptime|restarts|memory|cpu" || echo "not found"', { timeout: 5000, encoding: 'utf-8' });
            statusMap[svc] = result.trim();
          } else {
            const result = execSync(`systemctl is-active ${svc} 2>/dev/null || echo "unknown"`, { timeout: 5000, encoding: 'utf-8' });
            statusMap[svc] = result.trim();
          }
        } catch {
          statusMap[svc] = 'error';
        }
      }
      return NextResponse.json({ services: statusMap });
    }

    if (action === 'db-stats') {
      const { db } = require('@/lib/db');
      const tables = ['User', 'Domain', 'Order', 'Payment', 'HostingEnvironment', 'AgentSession', 'AgentMessage', 'AgentTask', 'Notification', 'AdminLog', 'UserActivityLog'];
      const counts: any = {};
      for (const table of tables) {
        try {
          counts[table] = await (db as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
        } catch {
          counts[table] = -1;
        }
      }
      const dbPath = path.join(PROJECT_ROOT, 'db', 'fahadcloud.db');
      const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
      return NextResponse.json({ counts, dbSize, dbPath });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/system - System actions (restart, rebuild, update env, etc.)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { action } = body;
    const ip = getClientIp(request);

    if (action === 'restart_app') {
      try {
        execSync('pm2 restart fahadcloud 2>&1', { timeout: 15000 });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_restart_app', targetType: 'system', targetId: 'fahadcloud', ipAddress: ip });
        return NextResponse.json({ message: 'Application restarted successfully' });
      } catch (e: any) {
        return NextResponse.json({ error: `Restart failed: ${e.message}` }, { status: 500 });
      }
    }

    if (action === 'rebuild_app') {
      try {
        // Run build in background
        execSync('cd /home/fahad/fahadcloud && npm run build 2>&1', { timeout: 120000 });
        execSync('cd /home/fahad/fahadcloud && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public 2>&1', { timeout: 30000 });
        execSync('cd /home/fahad/fahadcloud && mkdir -p .next/standalone/db && cp db/fahadcloud.db .next/standalone/db/ && cp -r prisma .next/standalone/ && cp -r node_modules/.prisma .next/standalone/node_modules/ 2>&1', { timeout: 30000 });
        execSync('pm2 restart fahadcloud 2>&1', { timeout: 15000 });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_rebuild', targetType: 'system', targetId: 'fahadcloud', ipAddress: ip });
        return NextResponse.json({ message: 'Application rebuilt and restarted successfully' });
      } catch (e: any) {
        return NextResponse.json({ error: `Rebuild failed: ${e.message}` }, { status: 500 });
      }
    }

    if (action === 'restart_nginx') {
      try {
        execSync('sudo systemctl restart nginx 2>&1', { timeout: 15000 });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_restart_nginx', targetType: 'system', targetId: 'nginx', ipAddress: ip });
        return NextResponse.json({ message: 'Nginx restarted successfully' });
      } catch (e: any) {
        return NextResponse.json({ error: `Nginx restart failed: ${e.message}` }, { status: 500 });
      }
    }

    if (action === 'update_env') {
      const { envContent } = body;
      if (!envContent) return NextResponse.json({ error: 'Environment content is required' }, { status: 400 });
      const envPath = path.join(PROJECT_ROOT, '.env');
      // Backup existing .env
      if (fs.existsSync(envPath)) {
        fs.copyFileSync(envPath, `${envPath}.backup.${Date.now()}`);
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
      await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_env_updated', targetType: 'system', targetId: 'env', ipAddress: ip });
      return NextResponse.json({ message: 'Environment updated. Restart the app to apply changes.' });
    }

    if (action === 'git_pull') {
      try {
        const result = execSync('cd /home/fahad/fahadcloud && git pull 2>&1', { timeout: 30000, encoding: 'utf-8' });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_git_pull', targetType: 'system', targetId: 'git', ipAddress: ip });
        return NextResponse.json({ message: 'Git pull completed', output: result.substring(0, 2000) });
      } catch (e: any) {
        return NextResponse.json({ error: `Git pull failed: ${e.message}`, output: e.stdout || '' }, { status: 500 });
      }
    }

    if (action === 'npm_install') {
      try {
        const result = execSync('cd /home/fahad/fahadcloud && npm install 2>&1', { timeout: 120000, encoding: 'utf-8' });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_npm_install', targetType: 'system', targetId: 'npm', ipAddress: ip });
        return NextResponse.json({ message: 'NPM install completed', output: result.substring(0, 2000) });
      } catch (e: any) {
        return NextResponse.json({ error: `NPM install failed: ${e.message}`, output: e.stdout || '' }, { status: 500 });
      }
    }

    if (action === 'db_migrate') {
      try {
        const result = execSync('cd /home/fahad/fahadcloud && npx prisma db push --accept-data-loss 2>&1', { timeout: 60000, encoding: 'utf-8' });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_db_migrate', targetType: 'system', targetId: 'prisma', ipAddress: ip });
        return NextResponse.json({ message: 'Database migration completed', output: result.substring(0, 2000) });
      } catch (e: any) {
        return NextResponse.json({ error: `Migration failed: ${e.message}` }, { status: 500 });
      }
    }

    if (action === 'clean_cache') {
      try {
        execSync('rm -rf /home/fahad/fahadcloud/.next/cache 2>&1', { timeout: 5000 });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_cache_cleared', targetType: 'system', targetId: 'cache', ipAddress: ip });
        return NextResponse.json({ message: 'Cache cleaned successfully' });
      } catch (e: any) {
        return NextResponse.json({ error: `Cache clean failed: ${e.message}` }, { status: 500 });
      }
    }

    if (action === 'run_command') {
      const { command } = body;
      if (!command) return NextResponse.json({ error: 'Command is required' }, { status: 400 });
      // Only allow safe commands
      const allowedPrefixes = ['ls', 'cat', 'head', 'tail', 'grep', 'find', 'wc', 'du', 'df', 'pwd', 'echo', 'node', 'npm', 'npx', 'pm2', 'git', 'docker', 'systemctl status'];
      const baseCmd = command.trim().split(/\s+/)[0];
      if (!allowedPrefixes.some(prefix => baseCmd === prefix || baseCmd.startsWith(prefix))) {
        return NextResponse.json({ error: `Command not allowed: ${baseCmd}` }, { status: 400 });
      }
      try {
        const result = execSync(`cd /home/fahad/fahadcloud && ${command} 2>&1`, { timeout: 30000, encoding: 'utf-8', maxBuffer: 1024 * 1024 });
        await adminLogRepository.logAction({ adminId: auth.user!.userId, action: 'system_command', targetType: 'system', targetId: 'command', details: JSON.stringify({ command }), ipAddress: ip });
        return NextResponse.json({ output: result.substring(0, 20000), command });
      } catch (e: any) {
        return NextResponse.json({ output: (e.stdout || '') + (e.stderr || ''), error: e.message, exitCode: e.status }, { status: 200 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
