// ============ INFRASTRUCTURE CONTROL v2.0 ============
// Docker/K8s orchestration, server cluster management,
// networking, IaC generation, and environment replication
// Now using safe shell execution to prevent command injection

import { db } from '@/lib/db';
import { AgentId, generateId } from '../types';
import { appConfig } from '@/lib/config/app.config';
import { safeExec, safeShellExec } from '@/lib/shell-utils';

// Local types
interface ContainerSpec { name: string; image: string; ports: number[]; env: Record<string, string>; cpu: string; memory: string; volumes?: string[]; }
interface ClusterNode { id: string; name: string; status: string; cpu: number; memory: number; ram?: number; disk?: number; containers: number; ip?: string; region?: string; labels?: Record<string, string>; }

// Input validation helpers
function isValidContainerId(id: string): boolean {
  return /^[a-f0-9]{1,64}$/i.test(id) || /^fc-[a-z0-9-]+$/i.test(id);
}

function isValidContainerName(name: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(name);
}

function isValidImageName(image: string): boolean {
  return /^[a-zA-Z0-9_.\/:-]{1,256}$/.test(image);
}

// ============ INFRASTRUCTURE ENGINE ============

export class InfrastructureEngine {

  // ============ DOCKER MANAGEMENT ============

  async listContainers(): Promise<{ containers: any[]; total: number }> {
    try {
      const output = safeExec('docker', ['ps', '-a', '--format', '{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}'], { timeout: 10000 });
      
      if (!output || !output.trim()) {
        return { containers: [], total: 0 };
      }

      const containers = output.trim().split('\n').filter(Boolean).map(line => {
        const [id, name, status, image, ports] = line.split('|');
        return { id, name, status, image, ports, running: status?.includes('Up') };
      });

      return { containers, total: containers.length };
    } catch {
      return { containers: [], total: 0 };
    }
  }

  async createContainer(spec: ContainerSpec): Promise<{ created: boolean; containerId?: string; error?: string }> {
    try {
      // Validate inputs
      if (!isValidContainerName(spec.name)) {
        return { created: false, error: 'Invalid container name' };
      }
      if (!isValidImageName(spec.image)) {
        return { created: false, error: 'Invalid image name' };
      }

      // Build docker run arguments safely using array
      const args = ['run', '-d', '--name', spec.name];
      
      // Add memory limit
      args.push('--memory', spec.memory || '256m');
      // Add CPU limit
      args.push('--cpus', spec.cpu || '0.5');
      // Add restart policy
      args.push('--restart', 'unless-stopped');

      // Add environment variables safely
      for (const [key, value] of Object.entries(spec.env || {})) {
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
          args.push('-e', `${key}=${value}`);
        }
      }

      // Add port mappings safely
      for (const port of (spec.ports || [])) {
        if (Number.isInteger(port) && port > 0 && port <= 65535) {
          args.push('-p', `${port}:${port}`);
        }
      }

      // Add volume mounts safely
      if (spec.volumes) {
        for (const [host, container] of Object.entries(spec.volumes)) {
          args.push('-v', `${host}:${container}`);
        }
      }

      args.push(spec.image);

      const output = safeExec('docker', args, { timeout: 60000 });
      
      return { created: true, containerId: output.trim() };
    } catch (error: any) {
      return { created: false, error: error.message };
    }
  }

  async manageContainer(containerId: string, action: 'start' | 'stop' | 'restart' | 'remove'): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate container ID
      if (!isValidContainerId(containerId)) {
        return { success: false, error: 'Invalid container ID' };
      }

      if (action === 'remove') {
        safeExec('docker', ['rm', '-f', containerId], { timeout: 30000 });
      } else {
        safeExec('docker', [action, containerId], { timeout: 30000 });
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============ CLUSTER MANAGEMENT ============

  getClusterStatus(): { nodes: ClusterNode[]; healthy: boolean } {
    // Returns the current server as the primary node
    try {
      const { getSystemInfo } = require('@/lib/sysutils');
      const sysInfo = getSystemInfo();
      
      const primaryNode: ClusterNode = {
        id: 'node-primary',
        name: 'fahadcloud-primary',
        ip: appConfig.serverIp,
        status: sysInfo.cpu < 80 && sysInfo.ram < 80 ? 'healthy' : 'warning',
        cpu: sysInfo.cpu,
        memory: sysInfo.ramUsed || 0,
        ram: sysInfo.ram,
        disk: sysInfo.disk,
        containers: 0,
        region: 'us-east-1',
        labels: { role: 'primary', tier: 'production' },
      };

      return { nodes: [primaryNode], healthy: primaryNode.status === 'healthy' };
    } catch {
      return { nodes: [], healthy: false };
    }
  }

  // ============ NETWORK MANAGEMENT ============

  getNetworkConfig(): { interfaces: any[]; routes: any[]; dns: string[]; firewall: any } {
    return {
      interfaces: [
        { name: 'eth0', ip: appConfig.serverIp, status: 'up', type: 'public' },
        { name: 'lo', ip: '127.0.0.1', status: 'up', type: 'loopback' },
      ],
      routes: [{ destination: '0.0.0.0/0', gateway: 'default', interface: 'eth0' }],
      dns: ['8.8.8.8', '8.8.4.4', '1.1.1.1'],
      firewall: {
        enabled: true,
        defaultPolicy: 'deny',
        rules: [
          { port: 443, protocol: 'HTTPS', action: 'allow' },
          { port: 80, protocol: 'HTTP', action: 'allow' },
          { port: 22, protocol: 'SSH', action: 'allow' },
          { port: 3000, protocol: 'HTTP', action: 'allow' },
        ],
      },
    };
  }

  // ============ INFRASTRUCTURE AS CODE ============

  generateIaC(type: 'docker-compose' | 'nginx' | 'systemd'): string {
    switch (type) {
      case 'docker-compose':
        return `version: '3.8'
services:
  web:
    image: node:20-alpine
    ports:
      - "3000:3000"
    volumes:
      - ./app:/app
    working_dir: /app
    command: npm start
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: fahadcloud
      POSTGRES_USER: fahadcloud
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fahadcloud"]
      interval: 15s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
  redis-data:
`;

      case 'nginx':
        return `server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;
}
`;

      case 'systemd':
        return `[Unit]
Description=FahadCloud Application
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=fahad
WorkingDirectory=${appConfig.projectRoot}
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
LimitNOFILE=65536
MemoryMax=1G

[Install]
WantedBy=multi-user.target
`;
    }
  }

  // ============ ENVIRONMENT REPLICATION ============

  async replicateEnvironment(sourceEnvId: string, targetName: string): Promise<{ success: boolean; newEnvId?: string; error?: string }> {
    try {
      // Validate target name
      if (!/^[a-zA-Z0-9-_]{1,64}$/.test(targetName)) {
        return { success: false, error: 'Invalid target name format' };
      }

      const source = await db.hostingEnvironment.findUnique({ where: { id: sourceEnvId } });
      if (!source) return { success: false, error: 'Source environment not found' };

      const newEnv = await db.hostingEnvironment.create({
        data: {
          userId: source.userId,
          planSlug: source.planSlug,
          status: 'active',
          rootPath: source.rootPath.replace(/[^/]+$/, targetName),
          serverType: source.serverType,
          nodeVersion: source.nodeVersion,
          phpVersion: source.phpVersion,
          pythonVersion: source.pythonVersion,
          sslEnabled: false,
          storageLimit: source.storageLimit,
        },
      });

      return { success: true, newEnvId: newEnv.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============ REVERSE PROXY CONFIG ============

  getReverseProxyConfig(): { upstream: any[]; routes: any[]; ssl: any } {
    return {
      upstream: [
        { name: 'fahadcloud_app', servers: ['127.0.0.1:3000'], method: 'least_conn' },
      ],
      routes: [
        { path: '/', upstream: 'fahadcloud_app', websocket: true },
        { path: '/api/', upstream: 'fahadcloud_app', cache: false },
        { path: '/static/', upstream: 'fahadcloud_app', cache: true, cacheTime: '7d' },
      ],
      ssl: {
        enabled: true,
        provider: 'letsencrypt',
        autoRenewal: true,
        protocols: ['TLSv1.2', 'TLSv1.3'],
        hsts: true,
        ocsp: true,
      },
    };
  }
}

// ============ SINGLETON ============

let infraInstance: InfrastructureEngine | null = null;

export function getInfrastructureEngine(): InfrastructureEngine {
  if (!infraInstance) {
    infraInstance = new InfrastructureEngine();
  }
  return infraInstance;
}
