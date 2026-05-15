// SSL Engine - Real SSL certificate provisioning via Let's Encrypt
// Also supports self-signed certificates for development/internal use
// SECURITY: All user inputs are validated; uses safeExec with array-based args

import { safeExec, safeShellExec } from '@/lib/shell-utils';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';

import { appConfig } from '@/lib/config/app.config';

const SSL_BASE_DIR = appConfig.hosting.sslDir;

// ============ INPUT VALIDATION ============

/**
 * Validates a domain name against RFC 1035 — only allows alphanumeric, dots, and hyphens.
 */
function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain) && domain.length <= 253;
}

/**
 * Validates an email address — only allows safe characters.
 * Rejects any email containing shell metacharacters.
 */
function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && email.length <= 254;
}

/**
 * Validates a file path for SSL operations — must be under SSL_BASE_DIR and not contain traversal.
 */
function isValidSslPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(SSL_BASE_DIR);
  // Path must be under SSL_BASE_DIR and not contain traversal
  return resolved.startsWith(resolvedBase) && !filePath.includes('..');
}

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
    // Input validation
    if (!isValidDomain(domain)) {
      return { success: false, error: `Invalid domain name: ${domain}` };
    }
    if (!isValidEmail(email)) {
      return { success: false, error: `Invalid email address: ${email}` };
    }

    try {
      const certDir = path.join(SSL_BASE_DIR, domain);
      if (!isValidSslPath(certDir)) {
        return { success: false, error: 'Invalid certificate directory path' };
      }
      mkdirSync(certDir, { recursive: true });

      // Check if certbot is installed — no user input in these commands
      try {
        safeExec('which', ['certbot'], { timeout: 5000 });
      } catch {
        safeShellExec('sudo apt-get install -y certbot python3-certbot-nginx', { timeout: 120000 });
      }

      // Issue certificate using standalone mode (requires port 80)
      // All user-controlled values are validated; passed as separate array args
      safeExec('sudo', [
        'certbot', 'certonly', '--standalone',
        '-d', domain,
        '--non-interactive',
        '--agree-tos',
        '--email', email,
        '--cert-name', domain,
      ], { timeout: 120000 });

      // Copy certs to our directory — paths are derived from validated domain
      const letsencryptPath = `/etc/letsencrypt/live/${domain}`;
      if (existsSync(letsencryptPath)) {
        safeExec('sudo', ['cp', `${letsencryptPath}/fullchain.pem`, `${certDir}/`], { timeout: 10000 });
        safeExec('sudo', ['cp', `${letsencryptPath}/privkey.pem`, `${certDir}/`], { timeout: 10000 });
        return { success: true, certPath: certDir };
      }

      return { success: false, error: 'Certificate issued but files not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Issue a self-signed certificate (for internal use/testing)
  issueSelfSigned(domain: string): { success: boolean; error?: string; certPath?: string } {
    // Input validation
    if (!isValidDomain(domain)) {
      return { success: false, error: `Invalid domain name: ${domain}` };
    }

    try {
      const certDir = path.join(SSL_BASE_DIR, domain);
      if (!isValidSslPath(certDir)) {
        return { success: false, error: 'Invalid certificate directory path' };
      }
      mkdirSync(certDir, { recursive: true });

      const keyPath = path.join(certDir, 'privkey.pem');
      const certPath = path.join(certDir, 'fullchain.pem');

      // Validate file paths are under SSL_BASE_DIR
      if (!isValidSslPath(keyPath) || !isValidSslPath(certPath)) {
        return { success: false, error: 'Invalid certificate file path' };
      }

      // Domain is validated; all args passed as array elements (no shell interpolation)
      safeExec('openssl', [
        'req', '-x509', '-nodes', '-days', '365',
        '-newkey', 'rsa:2048',
        '-keyout', keyPath,
        '-out', certPath,
        '-subj', `/CN=${domain}/O=FahadCloud/C=BD`,
      ], { timeout: 30000 });

      return { success: true, certPath: certDir };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check certificate status
  checkCertificate(domain: string): SslCertificate | null {
    // Input validation
    if (!isValidDomain(domain)) return null;

    const certDir = path.join(SSL_BASE_DIR, domain);
    const certPath = path.join(certDir, 'fullchain.pem');

    if (!isValidSslPath(certPath)) return null;
    if (!existsSync(certPath)) return null;

    try {
      const output = safeExec('openssl', [
        'x509', '-in', certPath, '-noout', '-dates', '-issuer', '-subject',
      ], { timeout: 10000 });

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
    // Input validation
    if (!isValidDomain(domain)) {
      return { success: false, error: `Invalid domain name: ${domain}` };
    }

    try {
      safeExec('sudo', [
        'certbot', 'renew', '--cert-name', domain, '--non-interactive',
      ], { timeout: 120000 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check when certificates are expiring (for health monitoring)
  checkCertificateExpiry(domain: string): { daysUntilExpiry: number; expiresAt: Date | null; warning: boolean } {
    const cert = this.checkCertificate(domain);
    if (!cert || !cert.expiresAt) {
      return { daysUntilExpiry: -1, expiresAt: null, warning: true };
    }
    
    try {
      const expiresAt = new Date(cert.expiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        daysUntilExpiry,
        expiresAt,
        warning: daysUntilExpiry <= 30,
      };
    } catch {
      return { daysUntilExpiry: -1, expiresAt: null, warning: true };
    }
  }

  // List all certificates
  listCertificates(): SslCertificate[] {
    try {
      const certs: SslCertificate[] = [];
      const entries = readdirSync(SSL_BASE_DIR, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const cert = this.checkCertificate(entry.name);
          if (cert) certs.push(cert);
        }
      }
      
      return certs;
    } catch {
      return [];
    }
  }
}

let sslEngineInstance: SslEngine | null = null;
export function getSslEngine(): SslEngine {
  if (!sslEngineInstance) sslEngineInstance = new SslEngine();
  return sslEngineInstance;
}
