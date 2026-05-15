// System utilities - uses proper ES imports
import { validateShellCommand, getSandboxEnv, getSandboxCwd } from '@/lib/shell-sandbox';
import os from 'os';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

export function getSystemInfo() {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();
    
    let disk = 0;
    try {
      const output = execSync("df -h / | tail -1 | awk '{print $5}' | tr -d '%'", { encoding: 'utf-8' });
      disk = parseInt(output.trim()) || 0;
    } catch {}

    const uptimeSecs = os.uptime();
    const days = Math.floor(uptimeSecs / 86400);
    const hours = Math.floor((uptimeSecs % 86400) / 3600);
    const minutes = Math.floor((uptimeSecs % 3600) / 60);
    let uptime = days > 0 ? days + 'd ' + hours + 'h ' + minutes + 'm' : hours > 0 ? hours + 'h ' + minutes + 'm' : minutes + 'm';

    return {
      cpu: Math.round(loadAvg[0] / cpus.length * 100), cpuCores: cpus.length,
      ram: Math.round(usedMem / totalMem * 100), ramTotal: Math.round(totalMem / 1024 / 1024), ramUsed: Math.round(usedMem / 1024 / 1024),
      disk, uptime, appStatus: 'running' as const, loadAverage: loadAvg.map((l: number) => l.toFixed(2)),
      issues: loadAvg[0] > cpus.length * 2 ? ['High CPU load detected'] : [],
    };
  } catch { return { cpu: 0, ram: 0, disk: 0, uptime: 'unknown', appStatus: 'unknown' as const, cpuCores: 1, ramTotal: 0, ramUsed: 0, loadAverage: ['0','0','0'], issues: [] }; }
}

export function executeCommand(command: string, userId: string): { output: string; exitCode: number } {
  // Validate command against sandbox rules
  const validation = validateShellCommand(command);
  if (!validation.safe) {
    return { output: `Command blocked: ${validation.reason}`, exitCode: 126 };
  }

  const homeDir = getSandboxCwd(userId);
  try { mkdirSync(homeDir, { recursive: true }); } catch {}
  try {
    const output = execSync(validation.sanitized!, {
      timeout: 15000,
      maxBuffer: 512 * 1024,
      encoding: 'utf-8',
      cwd: homeDir,
      env: { ...process.env, ...getSandboxEnv(userId) },
    });
    return { output: output || 'OK', exitCode: 0 };
  } catch (error: any) {
    let output = (error.stdout || '') + (error.stderr ? '\n' + error.stderr : '') || error.message;
    return { output, exitCode: error.status || 1 };
  }
}
