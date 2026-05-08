// Real Monitoring Engine - Collects, stores, and alerts on system metrics
// Records metrics to database for historical analysis

import { db } from '@/lib/db';

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
      const os = require('os');
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const loadAvg = os.loadavg();

      let disk = 0;
      try {
        const { execSync } = require('child_process');
        const output = execSync("df -h / | tail -1 | awk '{print $5}' | tr -d '%'", { encoding: 'utf-8' });
        disk = parseInt(output.trim()) || 0;
      } catch {}

      let dockerContainers = 0;
      try {
        const { execSync } = require('child_process');
        const output = execSync('docker ps -q | wc -l', { encoding: 'utf-8', timeout: 5000 });
        dockerContainers = parseInt(output.trim()) || 0;
      } catch {}

      let activeConnections = 0;
      try {
        const { execSync } = require('child_process');
        const output = execSync('ss -s | grep estab | head -1', { encoding: 'utf-8', timeout: 5000 });
        const match = output.match(/(\d+)/);
        activeConnections = match ? parseInt(match[1]) : 0;
      } catch {}

      const uptimeSecs = os.uptime();
      const days = Math.floor(uptimeSecs / 86400);
      const hours = Math.floor((uptimeSecs % 86400) / 3600);
      const minutes = Math.floor((uptimeSecs % 3600) / 60);
      const uptime = days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return {
        cpu: Math.round(loadAvg[0] / cpus.length * 100),
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
      
      await db.monitoringMetric.createMany({
        data: [
          { hostId: 'default', metricType: 'cpu', value: metrics.cpu, unit: 'percent' },
          { hostId: 'default', metricType: 'ram', value: metrics.ram, unit: 'percent' },
          { hostId: 'default', metricType: 'ram_used', value: metrics.ramUsed, unit: 'mb' },
          { hostId: 'default', metricType: 'ram_total', value: metrics.ramTotal, unit: 'mb' },
          { hostId: 'default', metricType: 'disk', value: metrics.disk, unit: 'percent' },
          { hostId: 'default', metricType: 'docker_containers', value: metrics.dockerContainers || 0, unit: 'count' },
          { hostId: 'default', metricType: 'active_connections', value: metrics.activeConnections || 0, unit: 'count' },
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
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
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
