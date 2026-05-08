// DNS Engine - Manages DNS zone files for real DNS resolution
// Compatible with BIND/PowerDNS zone file format

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const ZONES_DIR = '/home/fahad/dns/zones';
const DNS_CONFIG_DIR = '/home/fahad/dns/config';

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
  constructor() {
    // Ensure directories exist
    mkdirSync(ZONES_DIR, { recursive: true });
    mkdirSync(DNS_CONFIG_DIR, { recursive: true });
  }

  // Generate a zone file for a domain
  generateZoneFile(domain: string, records: DnsZoneRecord[]): string {
    const serial = Math.floor(Date.now() / 1000);
    const ns1 = 'ns1.fahadcloud.com';
    const ns2 = 'ns2.fahadcloud.com';
    const serverIp = '52.201.210.162';

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

    // Add custom records
    for (const record of records) {
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

  // Write zone file for a domain
  writeZoneFile(domain: string, records: DnsZoneRecord[]): { success: boolean; path: string; error?: string } {
    try {
      const zoneContent = this.generateZoneFile(domain, records);
      const filePath = path.join(ZONES_DIR, `${domain}.zone`);
      writeFileSync(filePath, zoneContent, 'utf-8');
      return { success: true, path: filePath };
    } catch (error: any) {
      return { success: false, path: '', error: error.message };
    }
  }

  // Read zone file for a domain
  readZoneFile(domain: string): string | null {
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

  // Reload DNS server (if running)
  reloadDnsServer(): { success: boolean; error?: string } {
    try {
      // Try to reload BIND/named if installed
      execSync('sudo rndc reload 2>/dev/null || echo "NO_RNDC"', { encoding: 'utf-8', timeout: 10000 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

let dnsEngineInstance: DnsEngine | null = null;
export function getDnsEngine(): DnsEngine {
  if (!dnsEngineInstance) dnsEngineInstance = new DnsEngine();
  return dnsEngineInstance;
}
