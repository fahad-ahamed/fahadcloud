// SSL Engine - Real SSL certificate provisioning via Let's Encrypt
// Also supports self-signed certificates for development/internal use

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';

import { appConfig } from '@/lib/config/app.config';

const SSL_BASE_DIR = appConfig.hosting.sslDir;

export interface SslCertificate {
  domain: string;
  type: 'letsencrypt' | 'self-signed';
  expiresAt: string;
  issuedAt: string;
  issuer: string;
  status: 'valid' | 'expired' | 'pending' | 'failed';
}

export class SslEngine {
  constructor() {
    mkdirSync(SSL_BASE_DIR, { recursive: true });
  }

  // Issue a Let's Encrypt certificate
  async issueLetsEncrypt(domain: string, email: string = appConfig.admin.superAdminEmail): Promise<{ success: boolean; error?: string; certPath?: string }> {
    try {
      const certDir = path.join(SSL_BASE_DIR, domain);
      mkdirSync(certDir, { recursive: true });

      // Check if certbot is installed
      try {
        execSync('which certbot', { encoding: 'utf-8', timeout: 5000 });
      } catch {
        // Install certbot
        execSync('sudo apt-get install -y certbot python3-certbot-nginx', { encoding: 'utf-8', timeout: 120000 });
      }

      // Issue certificate using standalone mode (requires port 80)
      const cmd = `sudo certbot certonly --standalone -d ${domain} --non-interactive --agree-tos --email ${email} --cert-name ${domain} 2>&1`;
      
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 120000 });
      
      // Copy certs to our directory
      const letsencryptPath = `/etc/letsencrypt/live/${domain}`;
      if (existsSync(letsencryptPath)) {
        execSync(`sudo cp ${letsencryptPath}/fullchain.pem ${certDir}/`, { encoding: 'utf-8' });
        execSync(`sudo cp ${letsencryptPath}/privkey.pem ${certDir}/`, { encoding: 'utf-8' });
        return { success: true, certPath: certDir };
      }

      return { success: false, error: 'Certificate issued but files not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Issue a self-signed certificate (for internal use/testing)
  issueSelfSigned(domain: string): { success: boolean; error?: string; certPath?: string } {
    try {
      const certDir = path.join(SSL_BASE_DIR, domain);
      mkdirSync(certDir, { recursive: true });

      const keyPath = path.join(certDir, 'privkey.pem');
      const certPath = path.join(certDir, 'fullchain.pem');

      execSync(
        `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -subj "/CN=${domain}/O=FahadCloud/C=BD"`,
        { encoding: 'utf-8', timeout: 30000 }
      );

      return { success: true, certPath: certDir };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check certificate status
  checkCertificate(domain: string): SslCertificate | null {
    const certDir = path.join(SSL_BASE_DIR, domain);
    const certPath = path.join(certDir, 'fullchain.pem');
    
    if (!existsSync(certPath)) return null;

    try {
      const output = execSync(
        `openssl x509 -in ${certPath} -noout -dates -issuer -subject`,
        { encoding: 'utf-8', timeout: 10000 }
      );

      const notAfter = output.match(/notAfter=(.*)/)?.[1] || '';
      const notBefore = output.match(/notBefore=(.*)/)?.[1] || '';
      const issuer = output.match(/issuer=(.*)/)?.[1] || '';
      const expiresAt = new Date(notAfter);
      const isExpired = expiresAt < new Date();

      return {
        domain,
        type: issuer.includes("Let's Encrypt") ? 'letsencrypt' : 'self-signed',
        expiresAt: notAfter,
        issuedAt: notBefore,
        issuer,
        status: isExpired ? 'expired' : 'valid',
      };
    } catch { return null; }
  }

  // Renew certificate
  async renewCertificate(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      execSync(`sudo certbot renew --cert-name ${domain} --non-interactive`, { encoding: 'utf-8', timeout: 120000 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

let sslEngineInstance: SslEngine | null = null;
export function getSslEngine(): SslEngine {
  if (!sslEngineInstance) sslEngineInstance = new SslEngine();
  return sslEngineInstance;
}
