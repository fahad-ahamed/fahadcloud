// Real Docker-Based Hosting Engine
// Creates isolated container environments for each user/domain

import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync as fsMkdirSync } from 'fs';
import { appConfig } from '@/lib/config/app.config';

export interface HostingContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  createdAt: string;
}

export interface DeployResult {
  success: boolean;
  containerId?: string;
  url?: string;
  error?: string;
  buildLog?: string;
}

// Framework to Docker image mapping
const FRAMEWORK_IMAGES: Record<string, { image: string; port: number; buildCmd?: string; startCmd: string }> = {
  static: { image: 'nginx:alpine', port: 80, startCmd: 'nginx -g "daemon off;"' },
  react: { image: 'node:18-alpine', port: 3000, buildCmd: 'npm run build', startCmd: 'npx serve -s build -l 3000' },
  nextjs: { image: 'node:18-alpine', port: 3000, buildCmd: 'npm run build', startCmd: 'npm start' },
  vue: { image: 'node:18-alpine', port: 3000, buildCmd: 'npm run build', startCmd: 'npx serve -s dist -l 3000' },
  nodejs: { image: 'node:18-alpine', port: 3000, startCmd: 'npm start' },
  express: { image: 'node:18-alpine', port: 3000, startCmd: 'npm start' },
  python: { image: 'python:3.11-slim', port: 5000, startCmd: 'python app.py' },
  php: { image: 'php:8.2-apache', port: 80, startCmd: 'apache2-foreground' },
};

export class HostingEngine {
  private dockerAvailable: boolean = false;

  constructor() {
    this.checkDocker();
  }

  private checkDocker(): void {
    try {
      execSync('docker info', { timeout: 5000, encoding: 'utf-8' });
      this.dockerAvailable = true;
    } catch {
      this.dockerAvailable = false;
    }
  }

  isDockerAvailable(): boolean {
    return this.dockerAvailable;
  }

  // Create a hosting environment for a user/domain
  async createHostingEnv(userId: string, domainName: string, framework: string): Promise<DeployResult> {
    if (!this.dockerAvailable) {
      return { success: false, error: 'Docker is not available on this server' };
    }

    const config = FRAMEWORK_IMAGES[framework] || FRAMEWORK_IMAGES.static!;
    const containerName = `fc-${userId.substring(0, 8)}-${domainName.replace(/\./g, '-')}`;
    const hostDir = `${appConfig.hosting.usersDir}/${userId}/${domainName}`;
    const port = await this.allocatePort();

    try {
      // Ensure hosting directory exists with index.html
      execSync(`mkdir -p ${hostDir}`, { encoding: 'utf-8' });
      
      // Ensure there's an index.html
      const indexPath = `${hostDir}/index.html`;
      if (!existsSync(indexPath)) {
        writeFileSync(indexPath, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${domainName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; color: white; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 2rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Site Deployed!</h1>
    <p>Your ${framework} app on <strong>${domainName}</strong> is live.</p>
    <div class="badge">Powered by FahadCloud</div>
  </div>
</body>
</html>`);
      }

      // Create nginx config for this site
      const nginxConfDir = `${appConfig.hosting.nginxDir}`;
      execSync(`mkdir -p ${nginxConfDir}`, { encoding: 'utf-8' });
      
      const nginxConf = `server {
    listen ${config.port};
    server_name ${domainName};
    root /app;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}`;
      writeFileSync(`${nginxConfDir}/${domainName}.conf`, nginxConf);

      // Stop and remove existing container if any
      try {
        execSync(`docker rm -f ${containerName} 2>/dev/null`, { encoding: 'utf-8', timeout: 10000 });
      } catch {}

      // Create and start container with proper volume mount
      let dockerCmd: string;
      if (framework === 'static' || config.image.includes('nginx')) {
        // For static/nginx, mount the site directory and custom config
        dockerCmd = `docker run -d \
          --name ${containerName} \
          --memory="256m" \
          --cpus="0.5" \
          --restart unless-stopped \
          -v ${hostDir}:/usr/share/nginx/html:ro \
          -v ${nginxConfDir}/${domainName}.conf:/etc/nginx/conf.d/default.conf:ro \
          -p ${port}:80 \
          ${config.image}`;
      } else {
        // For other frameworks, mount the app directory
        dockerCmd = `docker run -d \
          --name ${containerName} \
          --memory="256m" \
          --cpus="0.5" \
          --restart unless-stopped \
          -v ${hostDir}:/app \
          -p ${port}:${config.port} \
          -e NODE_ENV=production \
          -e PORT=${config.port} \
          -w /app \
          ${config.image} \
          sh -c "${config.startCmd}"`;
      }

      const containerId = execSync(dockerCmd, { encoding: 'utf-8', timeout: 60000 }).trim();

      return {
        success: true,
        containerId,
        url: `http://${process.env.SERVER_IP || 'localhost'}:${port}`,
        buildLog: `Container ${containerName} created with ${config.image} on port ${port}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        buildLog: `Failed to create container: ${error.message}`,
      };
    }
  }

  // Get hosting container status
  getContainerStatus(containerName: string): HostingContainer | null {
    if (!this.dockerAvailable) return null;
    try {
      const output = execSync(
        `docker inspect --format '{{.ID}}|{{.State.Status}}|{{.Config.Image}}|{{.NetworkSettings.Ports}}' ${containerName} 2>/dev/null`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      const [id, status, image, ports] = output.trim().split('|');
      return { id: id!.substring(0, 12), name: containerName, image: image!, status: status!, ports: ports ? [ports] : [], createdAt: '' };
    } catch {
      return null;
    }
  }

  // Stop a container
  async stopContainer(containerName: string): Promise<boolean> {
    if (!this.dockerAvailable) return false;
    try {
      execSync(`docker stop ${containerName}`, { encoding: 'utf-8', timeout: 30000 });
      return true;
    } catch { return false; }
  }

  // Start a container
  async startContainer(containerName: string): Promise<boolean> {
    if (!this.dockerAvailable) return false;
    try {
      execSync(`docker start ${containerName}`, { encoding: 'utf-8', timeout: 30000 });
      return true;
    } catch { return false; }
  }

  // Remove a container
  async removeContainer(containerName: string): Promise<boolean> {
    if (!this.dockerAvailable) return false;
    try {
      execSync(`docker rm -f ${containerName}`, { encoding: 'utf-8', timeout: 30000 });
      return true;
    } catch { return false; }
  }

  // List all user containers
  listUserContainers(userId: string): HostingContainer[] {
    if (!this.dockerAvailable) return [];
    try {
      const output = execSync(
        `docker ps -a --filter "name=fc-${userId.substring(0, 8)}" --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}"`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      return output.trim().split('\n').filter(Boolean).map(line => {
        const [id, name, status, image, ports] = line.split('|');
        return { id: id!, name: name!, status: status!, image: image!, ports: ports ? [ports] : [], createdAt: '' };
      });
    } catch { return []; }
  }

  // Allocate a dynamic port
  private async allocatePort(): Promise<number> {
    const basePort = 10000;
    const maxPort = 65535;
    try {
      const usedPorts = execSync(
        `docker ps --format "{{.Ports}}" | grep -oP '0\\.0\\.0\\.0:(\\d+)' | grep -oP '(?<=:)\\d+' | sort -u`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      const used = new Set(usedPorts.trim().split('\n').filter(Boolean).map(Number));
      for (let port = basePort; port < maxPort; port++) {
        if (!used.has(port)) return port;
      }
    } catch {}
    return basePort + Math.floor(Math.random() * 50000);
  }

  // Get container logs
  getContainerLogs(containerName: string, lines: number = 50): string {
    if (!this.dockerAvailable) return 'Docker not available';
    try {
      return execSync(`docker logs --tail ${lines} ${containerName} 2>&1`, { encoding: 'utf-8', timeout: 10000 });
    } catch (error: any) {
      return error.message;
    }
  }
}

// Singleton
let hostingEngineInstance: HostingEngine | null = null;
export function getHostingEngine(): HostingEngine {
  if (!hostingEngineInstance) hostingEngineInstance = new HostingEngine();
  return hostingEngineInstance;
}
