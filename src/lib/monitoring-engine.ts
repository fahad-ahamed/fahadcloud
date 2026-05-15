// Real Monitoring Engine - Collects, stores, and alerts on system metrics
// Records metrics to database for historical analysis
// Uses safeExec/safeShellExec for all shell command execution

import { db } from '@/lib/db';
import os from 'os';
import { safeExec, safeShellExec } from '@/lib/shell-utils';

// ============ INPUT VALIDATION ============

/**
 * Validates a host ID — must be alphanumeric with limited special chars.
 * Used for metric recording where hostId could come from external input.
 */
function isValidHostId(hostId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(hostId);
}

/**
 * Validates a metric type string — must be alphanumeric with underscores.
 */
function isValidMetricType(metricType: string): boolean {
  return /^[a-zA-Z0-9_]{1,64}$/.test(metricType);
}

export interface SystemMetrics {
  cpu: number;
  cpuCores: number;
  ram: number;
  ramTotal: number;
  ramUsed: number;
  ramFree: number;
  disk: number;
  loadAverage: number[];
  uptime: string;
  networkIn?: number;
  networkOut?: number;
  activeConnections?: number;
  dockerContainers?: number;
}

export interface MetricAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

export class MonitoringEngine {
  private alertThresholds = {
    cpu: { warning: 70, critical: 90 },
    ram: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
  };

  // Collect current system metrics
  collectMetrics(): SystemMetrics {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const loadAvg = os.loadavg();

      let disk = 0;
      try {
        // Uses safeShellExec for piped commands; no user input
        const output = safeShellExec("df -h / | tail -1 | awk '{print $5}' | tr -d '%'", { timeout: 5000 });
        disk = parseInt(output.trim()) || 0;
      } catch {}

      let dockerContainers = 0;
      try {
        // Array-based args — no shell interpolation
        const output = safeExec('docker', ['ps', '-q'], { timeout: 5000 });
        dockerContainers = output.trim().split('\n').filter(Boolean).length;
      } catch {}

      let activeConnections = 0;
      try {
        // Array-based args — no shell interpolation
        const output = safeExec('ss', ['-s'], { timeout: 5000 });
        const estabLine = output.split('\n').find(l => l.includes('estab'));
        if (estabLine) {
          const match = estabLine.match(/(\d+)/);
          activeConnections = match && match[1] ? parseInt(match[1]) : 0;
        }
      } catch {}

      const uptimeSecs = os.uptime();
      const days = Math.floor(uptimeSecs / 86400);
      const hours = Math.floor((uptimeSecs % 86400) / 3600);
      const minutes = Math.floor((uptimeSecs % 3600) / 60);
      const uptime = days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return {
        cpu: Math.round((loadAvg[0] ?? 0) / cpus.length * 100),
        cpuCores: cpus.length,
        ram: Math.round(usedMem / totalMem * 100),
        ramTotal: Math.round(totalMem / 1024 / 1024),
        ramUsed: Math.round(usedMem / 1024 / 1024),
        ramFree: Math.round(freeMem / 1024 / 1024),
        disk,
        loadAverage: loadAvg.map((l: number) => parseFloat(l.toFixed(2))),
        uptime,
        dockerContainers,
        activeConnections,
      };
    } catch {
      return { cpu: 0, cpuCores: 1, ram: 0, ramTotal: 0, ramUsed: 0, ramFree: 0, disk: 0, loadAverage: [0,0,0], uptime: 'unknown' };
    }
  }

  // Store metrics to database
  async recordMetrics(): Promise<void> {
    try {
      const metrics = this.collectMetrics();

      // Validate hostId before DB write
      const hostId = 'default';
      if (!isValidHostId(hostId)) {
        console.error('Invalid hostId for metrics recording');
        return;
      }

      await db.monitoringMetric.createMany({
        data: [
          { hostId, metricType: 'cpu', value: metrics.cpu, unit: 'percent' },
          { hostId, metricType: 'ram', value: metrics.ram, unit: 'percent' },
          { hostId, metricType: 'ram_used', value: metrics.ramUsed, unit: 'mb' },
          { hostId, metricType: 'ram_total', value: metrics.ramTotal, unit: 'mb' },
          { hostId, metricType: 'disk', value: metrics.disk, unit: 'percent' },
          { hostId, metricType: 'docker_containers', value: metrics.dockerContainers || 0, unit: 'count' },
          { hostId, metricType: 'active_connections', value: metrics.activeConnections || 0, unit: 'count' },
        ],
      });

      // Clean old metrics (keep last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await db.monitoringMetric.deleteMany({
        where: { recordedAt: { lt: sevenDaysAgo } },
      });
    } catch (error) {
      console.error('Failed to record metrics:', error);
    }
  }

  // Get historical metrics
  async getHistoricalMetrics(metricType: string, hours: number = 24): Promise<{ timestamp: string; value: number }[]> {
    // Validate metricType to prevent any potential injection
    if (!isValidMetricType(metricType)) {
      return [];
    }
    // Validate hours is a safe number
    const safeHours = Math.max(1, Math.min(8760, Math.floor(hours))); // Max 1 year

    try {
      const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
      const metrics = await db.monitoringMetric.findMany({
        where: { metricType, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'asc' },
        select: { value: true, recordedAt: true },
      });

      return metrics.map(m => ({
        timestamp: m.recordedAt.toISOString(),
        value: m.value,
      }));
    } catch { return []; }
  }

  // Check for alerts
  checkAlerts(metrics: SystemMetrics): MetricAlert[] {
    const alerts: MetricAlert[] = [];

    if (metrics.cpu >= this.alertThresholds.cpu.critical) {
      alerts.push({ id: `cpu-critical-${Date.now()}`, type: 'cpu', severity: 'critical', message: `CPU usage critical: ${metrics.cpu}%`, timestamp: new Date() });
    } else if (metrics.cpu >= this.alertThresholds.cpu.warning) {
      alerts.push({ id: `cpu-warning-${Date.now()}`, type: 'cpu', severity: 'warning', message: `CPU usage high: ${metrics.cpu}%`, timestamp: new Date() });
    }

    if (metrics.ram >= this.alertThresholds.ram.critical) {
      alerts.push({ id: `ram-critical-${Date.now()}`, type: 'ram', severity: 'critical', message: `RAM usage critical: ${metrics.ram}%`, timestamp: new Date() });
    } else if (metrics.ram >= this.alertThresholds.ram.warning) {
      alerts.push({ id: `ram-warning-${Date.now()}`, type: 'ram', severity: 'warning', message: `RAM usage high: ${metrics.ram}%`, timestamp: new Date() });
    }

    if (metrics.disk >= this.alertThresholds.disk.critical) {
      alerts.push({ id: `disk-critical-${Date.now()}`, type: 'disk', severity: 'critical', message: `Disk usage critical: ${metrics.disk}%`, timestamp: new Date() });
    } else if (metrics.disk >= this.alertThresholds.disk.warning) {
      alerts.push({ id: `disk-warning-${Date.now()}`, type: 'disk', severity: 'warning', message: `Disk usage high: ${metrics.disk}%`, timestamp: new Date() });
    }

    return alerts;
  }
}

let monitoringEngineInstance: MonitoringEngine | null = null;
export function getMonitoringEngine(): MonitoringEngine {
  if (!monitoringEngineInstance) monitoringEngineInstance = new MonitoringEngine();
  return monitoringEngineInstance;
}
