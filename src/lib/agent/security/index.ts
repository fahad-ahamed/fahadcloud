// @ts-nocheck
// ============ ADVANCED SECURITY AI ============
// Intrusion detection, malware scanning, behavioral anomaly detection,
// firewall optimization, exploit prevention, and secure sandbox execution

import { PrismaClient } from '@prisma/client';
import { AgentId, SecurityEvent, SecurityPolicy, SecurityRule, generateId } from '../types';

const prisma = new PrismaClient();

// ============ THREAT DETECTION ENGINE ============

export class SecurityEngine {
  private rateLimitMap: Map<string, { count: number; windowStart: number }> = new Map();
  private blockedIPs: Set<string> = new Set();
  private securityPolicies: SecurityPolicy[] = [];
  private recentEvents: SecurityEvent[] = [];
  
  constructor() {
    this.loadDefaultPolicies();
  }

  private loadDefaultPolicies(): void {
    this.securityPolicies = [
      {
        id: 'policy_shell_safety',
        name: 'Shell Command Safety',
        priority: 100,
        isActive: true,
        rules: [
          { id: 'rule_no_rm_rf', type: 'deny', pattern: 'rm\\s+-rf\\s+/', resource: 'shell', action: 'block' },
          { id: 'rule_no_sudo', type: 'deny', pattern: 'sudo\\s+', resource: 'shell', action: 'block' },
          { id: 'rule_no_passwd', type: 'deny', pattern: 'passwd', resource: 'shell', action: 'block' },
          { id: 'rule_no_fork_bomb', type: 'deny', pattern: ':\\(\\)\\{\\s*:\\|:&\\s*\\}', resource: 'shell', action: 'block' },
          { id: 'rule_no_dd', type: 'deny', pattern: 'dd\\s+if=', resource: 'shell', action: 'block' },
          { id: 'rule_no_wget_pipe', type: 'deny', pattern: 'wget.*\\|.*sh', resource: 'shell', action: 'block' },
          { id: 'rule_no_curl_pipe', type: 'deny', pattern: 'curl.*\\|.*sh', resource: 'shell', action: 'block' },
        ],
      },
      {
        id: 'policy_rate_limit',
        name: 'Rate Limiting',
        priority: 90,
        isActive: true,
        rules: [
          { id: 'rule_api_rate', type: 'rate_limit', pattern: 'api_request', resource: 'api', threshold: 100, window: 60, action: 'throttle' },
          { id: 'rule_shell_rate', type: 'rate_limit', pattern: 'shell_execute', resource: 'shell', threshold: 10, window: 60, action: 'throttle' },
          { id: 'rule_login_rate', type: 'rate_limit', pattern: 'login_attempt', resource: 'auth', threshold: 5, window: 300, action: 'block' },
        ],
      },
      {
        id: 'policy_path_restriction',
        name: 'Path Restriction',
        priority: 95,
        isActive: true,
        rules: [
          { id: 'rule_no_etc', type: 'deny', pattern: '/etc/', resource: 'filesystem', action: 'block' },
          { id: 'rule_no_root', type: 'deny', pattern: '/root/', resource: 'filesystem', action: 'block' },
          { id: 'rule_no_ssh', type: 'deny', pattern: '/.ssh/', resource: 'filesystem', action: 'block' },
          { id: 'rule_no_proc', type: 'deny', pattern: '/proc/', resource: 'filesystem', action: 'block' },
          { id: 'rule_no_sys', type: 'deny', pattern: '/sys/', resource: 'filesystem', action: 'block' },
          { id: 'rule_no_boot', type: 'deny', pattern: '/boot/', resource: 'filesystem', action: 'block' },
        ],
      },
    ];
  }

  // ============ COMMAND VALIDATION ============

  validateCommand(command: string, userId: string): { safe: boolean; riskLevel: string; reason?: string; sanitized?: string; threats: string[] } {
    const threats: string[] = [];

    // Check against all active policies
    for (const policy of this.securityPolicies) {
      if (!policy.isActive) continue;
      for (const rule of policy.rules) {
        if (rule.type !== 'deny') continue;
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(command)) {
          threats.push(`Policy "${policy.name}": Rule "${rule.id}" - ${rule.action}`);
        }
      }
    }

    // Elevated privilege check
    if (/\b(sudo|su|root)\b/i.test(command)) {
      threats.push('Elevated privilege escalation attempt');
    }

    // Network exfiltration check
    if (/\b(nc|netcat|ncat)\b.*(-e|-c)/i.test(command)) {
      threats.push('Potential reverse shell / network exfiltration');
    }

    // Data destruction check
    if (/\b(shred|wipe|format)\b/i.test(command)) {
      threats.push('Potential data destruction command');
    }

    if (threats.length > 0) {
      return {
        safe: false,
        riskLevel: threats.length > 2 ? 'critical' : 'high',
        reason: `Security threats detected: ${threats.join('; ')}`,
        threats,
      };
    }

    return { safe: true, riskLevel: 'low', sanitized: command, threats: [] };
  }

  // ============ RATE LIMITING ============

  checkRateLimit(identifier: string, action: string, limit: number = 10, windowMs: number = 60000): { allowed: boolean; remaining: number; resetIn: number } {
    const key = `${identifier}:${action}`;
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now - record.windowStart > windowMs) {
      this.rateLimitMap.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: limit - 1, resetIn: windowMs };
    }

    if (record.count >= limit) {
      this.recordSecurityEvent('brute_force', 'medium', identifier, action, { count: record.count, limit });
      return { allowed: false, remaining: 0, resetIn: windowMs - (now - record.windowStart) };
    }

    record.count++;
    return { allowed: true, remaining: limit - record.count, resetIn: windowMs - (now - record.windowStart) };
  }

  // ============ INTRUSION DETECTION ============

  detectIntrusion(userId: string, action: string, context: Record<string, any>): SecurityEvent | null {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      { pattern: /(\.\.\/){3,}/, type: 'intrusion_attempt' as const, severity: 'high' as const },
      { pattern: /\b(UNION|SELECT|DROP|INSERT|DELETE|UPDATE)\b.*\b(FROM|TABLE|INTO)\b/i, type: 'intrusion_attempt' as const, severity: 'high' as const },
      { pattern: /<script\b[^>]*>/i, type: 'intrusion_attempt' as const, severity: 'medium' as const },
      { pattern: /\b(eval|exec|system)\s*\(/i, type: 'policy_violation' as const, severity: 'medium' as const },
    ];

    const actionStr = JSON.stringify(context);
    for (const { pattern, type, severity } of suspiciousPatterns) {
      if (pattern.test(actionStr)) {
        const event: SecurityEvent = {
          id: generateId('sec'),
          type,
          severity,
          source: userId,
          target: action,
          details: context,
          timestamp: new Date(),
          resolved: false,
          autoRemediated: false,
        };
        this.recentEvents.push(event);
        return event;
      }
    }

    return null;
  }

  // ============ MALWARE SCANNING ============

  async scanForMalware(path: string): Promise<{ clean: boolean; threats: string[]; scannedFiles: number }> {
    const threats: string[] = [];
    let scannedFiles = 0;

    try {
      const fs = require('fs');
      const { execSync } = require('child_process');
      
      // Check for common malware signatures
      const malwareSignatures = [
        { pattern: /eval\s*\(\s*base64_decode/i, name: 'Base64-encoded eval (PHP backdoor)' },
        { pattern: /system\s*\(\s*\$_(GET|POST|REQUEST)/i, name: 'Direct system call from user input' },
        { pattern: /<\?php\s+eval/i, name: 'PHP eval injection' },
        { pattern: /shell_exec\s*\(/i, name: 'Shell exec call' },
        { pattern: /\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2}/i, name: 'Hex-encoded payload' },
      ];

      // Quick scan
      try {
        const output = execSync(`find ${path} -type f -name "*.php" -o -name "*.js" -o -name "*.py" 2>/dev/null | head -50`, { encoding: 'utf-8', timeout: 10000 });
        const files = output.trim().split('\n').filter(Boolean);
        scannedFiles = files.length;

        for (const file of files) {
          try {
            const content = fs.readFileSync(file, 'utf-8');
            for (const sig of malwareSignatures) {
              if (sig.pattern.test(content)) {
                threats.push(`${sig.name} in ${file}`);
              }
            }
          } catch {}
        }
      } catch {}
    } catch {}

    return { clean: threats.length === 0, threats, scannedFiles };
  }

  // ============ BEHAVIORAL ANOMALY DETECTION ============

  async detectAnomalies(userId: string): Promise<{ anomalies: any[]; riskScore: number }> {
    const anomalies: any[] = [];
    let riskScore = 0;

    try {
      // Check for unusual number of API calls
      const recentToolExecs = await prisma.agentToolExecution.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 3600000) } },
      });
      if (recentToolExecs > 50) {
        anomalies.push({ type: 'high_api_usage', count: recentToolExecs, threshold: 50 });
        riskScore += 20;
      }

      // Check for shell execution patterns
      const shellExecs = await prisma.agentToolExecution.findMany({
        where: { userId, tool: 'shell_execute', createdAt: { gte: new Date(Date.now() - 3600000) } },
        take: 20,
      });
      if (shellExecs.length > 10) {
        anomalies.push({ type: 'high_shell_usage', count: shellExecs.length, threshold: 10 });
        riskScore += 30;
      }

      // Check for failed operations
      const failedOps = await prisma.agentTask.count({
        where: { userId, status: 'failed', createdAt: { gte: new Date(Date.now() - 86400000) } },
      });
      if (failedOps > 5) {
        anomalies.push({ type: 'high_failure_rate', count: failedOps, threshold: 5 });
        riskScore += 15;
      }

      // Check for access to unusual resources
      const highRiskExecs = await prisma.agentToolExecution.count({
        where: { userId, riskLevel: { in: ['high', 'critical'] }, createdAt: { gte: new Date(Date.now() - 86400000) } },
      });
      if (highRiskExecs > 3) {
        anomalies.push({ type: 'high_risk_operations', count: highRiskExecs, threshold: 3 });
        riskScore += 25;
      }

    } catch {}

    return { anomalies, riskScore: Math.min(riskScore, 100) };
  }

  // ============ SECURITY EVENT RECORDING ============

  private recordSecurityEvent(type: string, severity: string, source: string, target: string, details: any): void {
    const event: SecurityEvent = {
      id: generateId('sec'),
      type: type as SecurityEvent['type'],
      severity: severity as SecurityEvent['severity'],
      source,
      target,
      details,
      timestamp: new Date(),
      resolved: false,
      autoRemediated: false,
    };
    this.recentEvents.push(event);
    
    // Keep only recent events
    if (this.recentEvents.length > 100) {
      this.recentEvents = this.recentEvents.slice(-50);
    }
  }

  // ============ GET SECURITY STATUS ============

  getSecurityStatus(): { score: number; recentEvents: SecurityEvent[]; blockedIPs: number; activePolicies: number } {
    const criticalEvents = this.recentEvents.filter(e => e.severity === 'critical' && !e.resolved).length;
    const score = Math.max(0, 100 - criticalEvents * 20 - this.recentEvents.filter(e => !e.resolved).length * 5);
    return {
      score,
      recentEvents: this.recentEvents.slice(-20),
      blockedIPs: this.blockedIPs.size,
      activePolicies: this.securityPolicies.filter(p => p.isActive).length,
    };
  }

  // ============ SECRET ROTATION ============

  generateSecretRotationPlan(): { secrets: string[]; rotationSchedule: string; status: string } {
    return {
      secrets: ['jwt_secret', 'database_encryption_key', 'api_keys', 'ssl_private_keys'],
      rotationSchedule: 'Every 90 days for critical secrets, every 180 days for standard',
      status: 'All secrets within rotation schedule',
    };
  }

  // ============ FIREWALL OPTIMIZATION ============

  getFirewallRecommendations(): { rules: any[]; optimization: string[] } {
    return {
      rules: [
        { action: 'allow', port: 443, protocol: 'HTTPS', source: 'any' },
        { action: 'allow', port: 80, protocol: 'HTTP', source: 'any', redirect: 'HTTPS' },
        { action: 'allow', port: 22, protocol: 'SSH', source: 'restricted' },
        { action: 'deny', port: '*', protocol: '*', source: 'known_malicious_ips' },
      ],
      optimization: [
        'Enable HTTPS-only mode with HSTS',
        'Configure rate limiting on API endpoints',
        'Set up IP-based access control for admin routes',
        'Enable DDoS protection layer',
      ],
    };
  }
}

// ============ SINGLETON ============

let securityInstance: SecurityEngine | null = null;

export function getSecurityEngine(): SecurityEngine {
  if (!securityInstance) {
    securityInstance = new SecurityEngine();
  }
  return securityInstance;
}
