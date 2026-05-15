// DNS Engine v3.0 - Manages DNS zone files AND serves them via dnsmasq
// Fixed: DNS records are now actually served, not just written to files
// SECURITY: Uses safeExec/safeShellExec; inputs validated before use

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { safeExec, safeShellExec } from '@/lib/shell-utils';
import path from 'path';
import { appConfig } from '@/lib/config/app.config';

const ZONES_DIR = appConfig.dns.zonesDir;
const DNS_CONFIG_DIR = appConfig.dns.configDir;
const DNSMASQ_CONF = appConfig.dns.dnsmasqConf;
const DNSMASQ_HOSTS = appConfig.dns.dnsmasqHosts;

// ============ INPUT VALIDATION ============

/**
 * Validates a domain name against RFC 1035 — only allows alphanumeric, dots, and hyphens.
 * Rejects any domain containing shell metacharacters.
 */
function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain) && domain.length <= 253;
}

/**
 * Validates a DNS record value — must be safe for zone files and command interpolation.
 * Allows: alphanumeric, dots, hyphens, underscores, colons, spaces (for TXT), slashes
 */
function isValidRecordValue(value: string, type: string): boolean {
  // Block any shell metacharacters
  if (/[`$\\;"!|&<>(){}[\]]/.test(value)) return false;
  if (value.length > 255) return false;

  switch (type.toUpperCase()) {
    case 'A':
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
    case 'AAAA':
      return /^[0-9a-fA-F:]+$/.test(value);
    case 'CNAME':
    case 'NS':
      return isValidDomain(value) || value.endsWith('.') && isValidDomain(value.slice(0, -1));
    case 'MX':
      return isValidDomain(value) || value.endsWith('.') && isValidDomain(value.slice(0, -1));
    case 'TXT':
      return value.length > 0;
    case 'SRV':
      return value.length > 0 && !/[`$\\;"!|&<>(){}[\]]/.test(value);
    default:
      return false;
  }
}

/**
 * Validates a DNS record name — allows @, alphanumeric, dots, hyphens, underscores
 */
function isValidRecordName(name: string): boolean {
  return /^[@*a-zA-Z0-9._-]+$/.test(name) && name.length <= 253;
}

export interface DnsZone {
  domain: string;
  ttl: number;
  serial: number;
  records: DnsZoneRecord[];
}

export interface DnsZoneRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export class DnsEngine {
  private dnsmasqRunning: boolean = false;

  constructor() {
    mkdirSync(ZONES_DIR, { recursive: true });
    mkdirSync(DNS_CONFIG_DIR, { recursive: true });
    this.checkDnsmasq();
  }

  private checkDnsmasq(): void {
    try {
      safeExec('which', ['dnsmasq'], { timeout: 5000 });
      this.dnsmasqRunning = true;
    } catch {
      this.dnsmasqRunning = false;
      // Try to install dnsmasq
      try {
        safeShellExec('sudo apt-get install -y dnsmasq 2>&1', { timeout: 60000 });
        this.dnsmasqRunning = true;
      } catch {
        console.error('dnsmasq not available - DNS records will be written but not served');
      }
    }
  }

  isDnsServing(): boolean {
    return this.dnsmasqRunning;
  }

  // Generate a zone file for a domain
  generateZoneFile(domain: string, records: DnsZoneRecord[]): string {
    if (!isValidDomain(domain)) {
      throw new Error(`Invalid domain name: ${domain}`);
    }

    const serial = Math.floor(Date.now() / 1000);
    const ns1 = 'ns1.fahadcloud.com';
    const ns2 = 'ns2.fahadcloud.com';
    const serverIp = appConfig.serverIp;

    let zoneFile = `$ORIGIN ${domain}.\n`;
    zoneFile += `$TTL 3600\n`;
    zoneFile += `@       IN  SOA  ${ns1}. admin.fahadcloud.com. (\n`;
    zoneFile += `            ${serial}  ; Serial\n`;
    zoneFile += `            3600        ; Refresh\n`;
    zoneFile += `            900         ; Retry\n`;
    zoneFile += `            604800      ; Expire\n`;
    zoneFile += `            86400       ; Minimum TTL\n`;
    zoneFile += `        )\n\n`;
    zoneFile += `; Name Servers\n`;
    zoneFile += `@       IN  NS   ${ns1}.\n`;
    zoneFile += `@       IN  NS   ${ns2}.\n\n`;
    zoneFile += `; Default A Records\n`;
    zoneFile += `@       IN  A    ${serverIp}\n`;
    zoneFile += `www     IN  A    ${serverIp}\n\n`;

    for (const record of records) {
      // Validate each record before writing
      if (!isValidRecordName(record.name)) {
        console.warn(`Skipping invalid DNS record name: ${record.name}`);
        continue;
      }
      if (!isValidRecordValue(record.value, record.type)) {
        console.warn(`Skipping invalid DNS record value for ${record.name} (${record.type}): ${record.value}`);
        continue;
      }

      const name = record.name === '@' ? '@' : record.name.replace(`.${domain}`, '');
      const ttl = record.ttl || 3600;

      switch (record.type.toUpperCase()) {
        case 'A':
          zoneFile += `${name}   ${ttl}  IN  A    ${record.value}\n`;
          break;
        case 'AAAA':
          zoneFile += `${name}   ${ttl}  IN  AAAA ${record.value}\n`;
          break;
        case 'CNAME':
          zoneFile += `${name}   ${ttl}  IN  CNAME ${record.value}.\n`;
          break;
        case 'MX':
          zoneFile += `${name}   ${ttl}  IN  MX   ${record.priority || 10} ${record.value}.\n`;
          break;
        case 'TXT':
          zoneFile += `${name}   ${ttl}  IN  TXT  "${record.value}"\n`;
          break;
        case 'NS':
          zoneFile += `${name}   ${ttl}  IN  NS   ${record.value}.\n`;
          break;
        case 'SRV':
          zoneFile += `${name}   ${ttl}  IN  SRV  ${record.priority || 10} 0 ${record.value}\n`;
          break;
      }
    }

    return zoneFile;
  }

  // Write zone file for a domain AND serve it
  writeZoneFile(domain: string, records: DnsZoneRecord[]): { success: boolean; path: string; serving: boolean; error?: string } {
    if (!isValidDomain(domain)) {
      return { success: false, path: '', serving: false, error: `Invalid domain name: ${domain}` };
    }

    try {
      const zoneContent = this.generateZoneFile(domain, records);
      const filePath = path.join(ZONES_DIR, `${domain}.zone`);
      writeFileSync(filePath, zoneContent, 'utf-8');

      // Update dnsmasq hosts file for actual DNS serving
      const serving = this.updateDnsmasqHosts(domain, records);

      return { success: true, path: filePath, serving };
    } catch (error: any) {
      return { success: false, path: '', serving: false, error: error.message };
    }
  }

  // ============ NEW: Actually serve DNS records via dnsmasq ============

  private updateDnsmasqHosts(domain: string, records: DnsZoneRecord[]): boolean {
    const serverIp = appConfig.serverIp;

    try {
      // Build hosts file entries
      let hostsContent = `# FahadCloud DNS - ${domain}\n`;

      for (const record of records) {
        // Validate record before writing
        if (!isValidRecordName(record.name) || !isValidRecordValue(record.value, record.type)) {
          continue;
        }

        switch (record.type.toUpperCase()) {
          case 'A':
            hostsContent += `${record.value} ${record.name === '@' ? domain : `${record.name}.${domain}`}\n`;
            break;
          case 'CNAME':
            hostsContent += `# CNAME: ${record.name}.${domain} -> ${record.value}\n`;
            break;
        }
      }

      // Ensure default entries
      if (!records.some(r => r.type === 'A' && r.name === '@')) {
        hostsContent += `${serverIp} ${domain}\n`;
      }
      if (!records.some(r => r.type === 'A' && r.name === 'www')) {
        hostsContent += `${serverIp} www.${domain}\n`;
      }

      // Write hosts file
      const hostsPath = path.join(DNS_CONFIG_DIR, `${domain}.hosts`);
      writeFileSync(hostsPath, hostsContent, 'utf-8');

      // Rebuild main dnsmasq config
      this.rebuildDnsmasqConfig();

      // Reload dnsmasq
      return this.reloadDnsServer().success;
    } catch (error: any) {
      console.error('Failed to update dnsmasq hosts:', error.message);
      return false;
    }
  }

  private rebuildDnsmasqConfig(): void {
    try {
      let config = `# FahadCloud DNS Server Configuration\n`;
      config += `# Auto-generated - do not edit manually\n\n`;
      config += `port=53\n`;
      config += `domain-needed\n`;
      config += `bogus-priv\n`;
      config += `no-resolv\n`;
      config += `server=8.8.8.8\n`;
      config += `server=8.8.4.4\n`;
      config += `server=1.1.1.1\n\n`;
      config += `# Local DNS records\n`;
      config += `addn-hosts=${DNSMASQ_HOSTS}\n\n`;

      // Include all domain-specific hosts files
      const hostsFiles = readdirSync(DNS_CONFIG_DIR)
        .filter(f => f.endsWith('.hosts'));

      for (const hf of hostsFiles) {
        config += `addn-hosts=${path.join(DNS_CONFIG_DIR, hf)}\n`;
      }

      writeFileSync(DNSMASQ_CONF, config, 'utf-8');

      // Build combined hosts file
      let combinedHosts = `# FahadCloud Combined DNS Hosts\n`;
      for (const hf of hostsFiles) {
        try {
          combinedHosts += readFileSync(path.join(DNS_CONFIG_DIR, hf), 'utf-8') + '\n';
        } catch {}
      }
      writeFileSync(DNSMASQ_HOSTS, combinedHosts, 'utf-8');
    } catch (error: any) {
      console.error('Failed to rebuild dnsmasq config:', error.message);
    }
  }

  // Read zone file for a domain
  readZoneFile(domain: string): string | null {
    if (!isValidDomain(domain)) return null;
    try {
      const filePath = path.join(ZONES_DIR, `${domain}.zone`);
      if (!existsSync(filePath)) return null;
      return readFileSync(filePath, 'utf-8');
    } catch { return null; }
  }

  // List all managed zones
  listZones(): string[] {
    try {
      return readdirSync(ZONES_DIR)
        .filter(f => f.endsWith('.zone'))
        .map(f => f.replace('.zone', ''));
    } catch { return []; }
  }

  // Delete a zone
  deleteZone(domain: string): boolean {
    if (!isValidDomain(domain)) return false;
    try {
      const zonePath = path.join(ZONES_DIR, `${domain}.zone`);
      const hostsPath = path.join(DNS_CONFIG_DIR, `${domain}.hosts`);

      if (existsSync(zonePath)) unlinkSync(zonePath);
      if (existsSync(hostsPath)) unlinkSync(hostsPath);

      this.rebuildDnsmasqConfig();
      this.reloadDnsServer();
      return true;
    } catch {
      return false;
    }
  }

  // Reload DNS server - uses safeShellExec for commands with shell redirects
  reloadDnsServer(): { success: boolean; error?: string } {
    try {
      // Try dnsmasq first (preferred)
      if (this.dnsmasqRunning) {
        try {
          safeShellExec('sudo systemctl restart dnsmasq 2>/dev/null || sudo service dnsmasq restart 2>/dev/null', { timeout: 10000 });
          return { success: true };
        } catch {}
      }

      // Try BIND/named as fallback
      try {
        safeExec('sudo', ['rndc', 'reload'], { timeout: 10000 });
        return { success: true };
      } catch {}

      return { success: false, error: 'No DNS server available to reload' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Start DNS server
  startDnsServer(): { success: boolean; error?: string } {
    try {
      if (this.dnsmasqRunning) {
        safeShellExec('sudo systemctl start dnsmasq 2>/dev/null || sudo service dnsmasq start 2>/dev/null', { timeout: 10000 });
        return { success: true };
      }
      return { success: false, error: 'dnsmasq not installed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Stop DNS server
  stopDnsServer(): { success: boolean; error?: string } {
    try {
      safeShellExec('sudo systemctl stop dnsmasq 2>/dev/null || sudo service dnsmasq stop 2>/dev/null', { timeout: 10000 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get DNS server status
  getDnsServerStatus(): { running: boolean; server: string; zonesServed: number; port: number } {
    try {
      const result = safeShellExec('sudo systemctl is-active dnsmasq 2>/dev/null || echo "inactive"', { timeout: 5000 }).trim();
      return {
        running: result === 'active',
        server: 'dnsmasq',
        zonesServed: this.listZones().length,
        port: 53,
      };
    } catch {
      return { running: false, server: 'none', zonesServed: 0, port: 53 };
    }
  }

  // Test DNS resolution for a domain
  testResolution(domain: string): { resolved: boolean; ip?: string; error?: string } {
    if (!isValidDomain(domain)) {
      return { resolved: false, error: `Invalid domain name: ${domain}` };
    }
    try {
      // Try dig first with array-based args
      try {
        const result = safeExec('dig', ['@localhost', domain, '+short'], { timeout: 10000 });
        const ip = result.trim().split('\n')[0];
        if (ip) return { resolved: true, ip };
      } catch {}

      // Fallback to nslookup with array-based args
      try {
        const result = safeExec('nslookup', [domain, 'localhost'], { timeout: 10000 });
        const lines = result.trim().split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]?.includes('Address:') && i > 0) {
            const ip = lines[i]?.replace(/Address:\s*/, '').trim();
            if (ip) return { resolved: true, ip };
          }
        }
      } catch {}

      return { resolved: false, error: 'Could not resolve domain' };
    } catch (error: any) {
      return { resolved: false, error: error.message };
    }
  }
}

let dnsEngineInstance: DnsEngine | null = null;
export function getDnsEngine(): DnsEngine {
  if (!dnsEngineInstance) dnsEngineInstance = new DnsEngine();
  return dnsEngineInstance;
}
