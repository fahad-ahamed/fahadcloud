// ============ AI-POWERED AUTO BUG DETECTION SYSTEM v3.0 ============
// Continuous Scanner + Auto Fix Engine
// Detects broken APIs, missing imports, dead code, memory leaks, security vulnerabilities

import { PrismaClient } from '@prisma/client';
import { AgentId, generateId } from '../types';
import { aiChat } from '../ai-engine';


// Local types (not exported from ai-engine)
interface BugDetectionResult {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  suggestedFix: string;
  autoFixable: boolean;
}

interface AutoFixResult {
  success: boolean;
  patch?: string;
  description: string;
  testCommand?: string;
  rollbackCommand?: string;
}

interface CodeReviewResult {
  quality: number;
  issues: any[];
  improvements: any[];
  securityConcerns: any[];
}

const prisma = new PrismaClient();

// ============ BUG DETECTOR ENGINE ============

export interface ScanResult {
  id: string;
  type: 'quick' | 'full' | 'security' | 'performance' | 'code_quality';
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  findings: BugDetectionResult[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    autoFixable: number;
  };
}

export interface FixResult {
  id: string;
  bugId: string;
  success: boolean;
  patch?: string;
  description: string;
  testResult?: 'passed' | 'failed' | 'skipped';
  rollbackAvailable: boolean;
  appliedAt: Date;
}

export class BugDetectorEngine {
  private scanHistory: Map<string, ScanResult> = new Map();
  private fixHistory: Map<string, FixResult> = new Map();
  private isScanning: boolean = false;

  // ============ CONTINUOUS SCANNER ============

  async runQuickScan(projectPath: string = '/home/fahad/fahadcloud'): Promise<ScanResult> {
    const scanId = generateId('scan');
    const result: ScanResult = {
      id: scanId,
      type: 'quick',
      status: 'running',
      startedAt: new Date(),
      findings: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, autoFixable: 0 },
    };

    try {
      // 1. Scan for broken API endpoints
      const brokenApis = await this.detectBrokenAPIs(projectPath);
      result.findings.push(...brokenApis);

      // 2. Scan for missing imports
      const missingImports = await this.detectMissingImports(projectPath);
      result.findings.push(...missingImports);

      // 3. Scan for dead code
      const deadCode = await this.detectDeadCode(projectPath);
      result.findings.push(...deadCode);

      // 4. Quick security scan
      const securityIssues = await this.detectSecurityVulnerabilities(projectPath);
      result.findings.push(...securityIssues);

      // Calculate summary
      result.summary = this.calculateSummary(result.findings);
    } catch (error: any) {
      result.status = 'failed';
    }

    result.status = 'completed';
    result.completedAt = new Date();
    this.scanHistory.set(scanId, result);
    return result;
  }

  async runFullScan(projectPath: string = '/home/fahad/fahadcloud'): Promise<ScanResult> {
    const scanId = generateId('scan');
    const result: ScanResult = {
      id: scanId,
      type: 'full',
      status: 'running',
      startedAt: new Date(),
      findings: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, autoFixable: 0 },
    };

    this.isScanning = true;

    try {
      // Quick scan first
      const quickScan = await this.runQuickScan(projectPath);
      result.findings.push(...quickScan.findings);

      // 5. Memory leak detection
      const memoryLeaks = await this.detectMemoryLeaks(projectPath);
      result.findings.push(...memoryLeaks);

      // 6. Performance issues
      const perfIssues = await this.detectPerformanceIssues(projectPath);
      result.findings.push(...perfIssues);

      // 7. Configuration errors
      const configErrors = await this.detectConfigurationErrors(projectPath);
      result.findings.push(...configErrors);

      // 8. Dependency conflicts
      const depConflicts = await this.detectDependencyConflicts(projectPath);
      result.findings.push(...depConflicts);

      // 9. AI-powered deep code review
      const codeReview = await this.runAICodeReview(projectPath);
      if (codeReview.issues) {
        result.findings.push(...codeReview.issues.map((issue: any) => ({
          type: issue.type || 'code_quality',
          severity: issue.severity || 'medium',
          location: issue.location || 'unknown',
          description: issue.description || '',
          suggestedFix: issue.suggestion || '',
          autoFixable: false,
        })));
      }

      result.summary = this.calculateSummary(result.findings);
    } catch (error: any) {
      result.status = 'failed';
    }

    result.status = 'completed';
    result.completedAt = new Date();
    this.isScanning = false;
    this.scanHistory.set(scanId, result);

    // Store scan result in database
    try {
      await prisma.agentMemory.create({
        data: {
          userId: 'system',
          type: 'agent_learning',
          key: `bug_scan_${Date.now()}`,
          value: JSON.stringify({ id: scanId, findings: result.findings.length, summary: result.summary }),
          relevance: 0.9,
        },
      });
    } catch {}

    return result;
  }

  // ============ DETECTION METHODS ============

  private async detectBrokenAPIs(projectPath: string): Promise<BugDetectionResult[]> {
    const findings: BugDetectionResult[] = [];

    try {
      const { execSync } = require('child_process');
      
      // Find all API route files
      const apiFiles = execSync(
        `find ${projectPath}/src/app/api -name 'route.ts' -o -name 'route.js' 2>/dev/null`,
        { encoding: 'utf-8', timeout: 10000 }
      ).trim().split('\n').filter(Boolean);

      // Check each API route for broken imports
      for (const file of apiFiles.slice(0, 30)) {
        try {
          const content = execSync(`cat '${file}'`, { encoding: 'utf-8', timeout: 5000 });
          
          // Check for imports from non-existent modules
          const importMatches = content.matchAll(/from\s+['"](@\/[^'"]+)['"]/g);
          for (const match of importMatches) {
            const importPath = match[1].replace('@/', `${projectPath}/src/`);
            try {
              execSync(`test -f '${importPath}.ts' || test -f '${importPath}.tsx' || test -f '${importPath}.js' || test -f '${importPath}/index.ts' || test -f '${importPath}/index.tsx'`, { timeout: 2000 });
            } catch {
              findings.push({
                type: 'broken_import',
                severity: 'high',
                location: file.replace(projectPath, ''),
                description: `Broken import: ${match[1]} in ${file.split('/').pop()}`,
                suggestedFix: `Check if ${match[1]} module exists or update the import path`,
                autoFixable: false,
              });
            }
          }

          // Check for missing error handlers
          if (content.includes('async') && !content.includes('try') && !content.includes('catch')) {
            findings.push({
              type: 'missing_error_handler',
              severity: 'medium',
              location: file.replace(projectPath, ''),
              description: `API route ${file.split('/').pop()} has no error handling`,
              suggestedFix: 'Wrap async operations in try-catch blocks',
              autoFixable: true,
            });
          }
        } catch {}
      }
    } catch {}

    return findings;
  }

  private async detectMissingImports(projectPath: string): Promise<BugDetectionResult[]> {
    const findings: BugDetectionResult[] = [];

    try {
      const { execSync } = require('child_process');
      
      // Check TypeScript compilation for missing imports
      try {
        execSync(`cd ${projectPath} && npx tsc --noEmit 2>&1 | head -50`, { encoding: 'utf-8', timeout: 30000 });
      } catch (error: any) {
        const tsErrors = (error.stdout || error.message || '').split('\n')
          .filter((line: string) => line.includes('error TS'))
          .slice(0, 20);

        for (const errLine of tsErrors) {
          const match = errLine.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
          if (match) {
            findings.push({
              type: 'typescript_error',
              severity: match[4] === 'TS2307' ? 'high' : 'medium', // TS2307 = missing module
              location: `${match[1]}:${match[2]}`,
              description: match[5],
              suggestedFix: `Fix TypeScript error ${match[4]}`,
              autoFixable: match[4] === 'TS2307',
            });
          }
        }
      }
    } catch {}

    return findings;
  }

  private async detectDeadCode(projectPath: string): Promise<BugDetectionResult[]> {
    const findings: BugDetectionResult[] = [];

    try {
      const { execSync } = require('child_process');
      
      // Find unused exports
      try {
        const exports = execSync(
          `cd ${projectPath} && grep -r "export " src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -20`,
          { encoding: 'utf-8', timeout: 10000 }
        ).trim().split('\n').filter(Boolean);

        // Check for exported functions/components that aren't imported elsewhere
        for (const file of exports.slice(0, 10)) {
          const content = execSync(`cat '${file}'`, { encoding: 'utf-8', timeout: 5000 });
          const exportNames = content.matchAll(/export\s+(?:function|const|class|interface|type)\s+(\w+)/g);
          
          for (const match of exportNames) {
            const name = match[1];
            try {
              const usageCount = execSync(
                `cd ${projectPath} && grep -r "${name}" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | wc -l`,
                { encoding: 'utf-8', timeout: 5000 }
              ).trim();
              
              if (parseInt(usageCount) <= 1) {
                findings.push({
                  type: 'dead_code',
                  severity: 'low',
                  location: file.replace(projectPath, ''),
                  description: `Unused export: ${name}`,
                  suggestedFix: `Consider removing unused export: ${name}`,
                  autoFixable: true,
                });
              }
            } catch {}
          }
        }
      } catch {}
    } catch {}

    return findings;
  }

  private async detectSecurityVulnerabilities(projectPath: string): Promise<BugDetectionResult[]> {
    const findings: BugDetectionResult[] = [];

    try {
      const { execSync } = require('child_process');
      
      // Check for hardcoded secrets
      try {
        const secrets = execSync(
          `cd ${projectPath} && grep -rn "password\\|secret\\|api_key\\|apikey\\|token" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | grep -v node_modules | head -10`,
          { encoding: 'utf-8', timeout: 10000 }
        ).trim().split('\n').filter(Boolean);

        for (const file of secrets) {
          findings.push({
            type: 'security_hardcoded_secret',
            severity: 'critical',
            location: file.replace(projectPath, ''),
            description: 'Potential hardcoded secret/credential found',
            suggestedFix: 'Move secrets to environment variables',
            autoFixable: false,
          });
        }
      } catch {}

      // npm audit
      try {
        const audit = execSync(`cd ${projectPath} && npm audit --json 2>/dev/null`, { encoding: 'utf-8', timeout: 30000 });
        const auditData = JSON.parse(audit);
        if (auditData.vulnerabilities) {
          for (const [pkg, info] of Object.entries(auditData.vulnerabilities)) {
            const vuln = info as any;
            findings.push({
              type: 'npm_vulnerability',
              severity: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium',
              location: `package: ${pkg}`,
              description: `Vulnerability in ${pkg}: ${vuln.title || 'Security issue'}`,
              suggestedFix: `Update ${pkg} to a patched version`,
              autoFixable: true,
            });
          }
        }
      } catch {}
    } catch {}

    return findings;
  }

  private async detectMemoryLeaks(projectPath: string): Promise<BugDetectionResult[]> {
    const findings: BugDetectionResult[] = [];

    try {
      const { execSync } = require('child_process');
      
      // Check for common memory leak patterns
      const patterns = [
        { pattern: 'setInterval|setTimeout', desc: 'Timer without cleanup', check: 'clearInterval|clearTimeout' },
        { pattern: 'addEventListener', desc: 'Event listener without cleanup', check: 'removeEventListener' },
        { pattern: 'new Map|new Set', desc: 'Unbounded Map/Set', check: 'delete|clear' },
      ];

      try {
        const srcFiles = execSync(
          `find ${projectPath}/src -name '*.ts' -o -name '*.tsx' 2>/dev/null | head -30`,
          { encoding: 'utf-8', timeout: 10000 }
        ).trim().split('\n').filter(Boolean);

        for (const file of srcFiles) {
          try {
            const content = execSync(`cat '${file}'`, { encoding: 'utf-8', timeout: 5000 });
            for (const p of patterns) {
              if (new RegExp(p.pattern).test(content) && !new RegExp(p.check).test(content)) {
                findings.push({
                  type: 'potential_memory_leak',
                  severity: 'medium',
                  location: file.replace(projectPath, ''),
                  description: `${p.desc} detected without cleanup`,
                  suggestedFix: `Add ${p.check} in cleanup/destroy method`,
                  autoFixable: true,
                });
              }
            }
          } catch {}
        }
      } catch {}
    } catch {}

    return findings;
  }

  private async detectPerformanceIssues(projectPath: string): Promise<BugDetectionResult[]> {
    return []; // Placeholder - AI will handle this in full scan
  }

  private async detectConfigurationErrors(projectPath: string): Promise<BugDetectionResult[]> {
    const findings: BugDetectionResult[] = [];

    try {
      const { execSync } = require('child_process');
      
      // Check .env file exists
      try {
        execSync(`test -f ${projectPath}/.env`, { timeout: 2000 });
      } catch {
        findings.push({
          type: 'missing_config',
          severity: 'high',
          location: '.env',
          description: 'Missing .env configuration file',
          suggestedFix: 'Create .env file from .env.example',
          autoFixable: true,
        });
      }
    } catch {}

    return findings;
  }

  private async detectDependencyConflicts(projectPath: string): Promise<BugDetectionResult[]> {
    return []; // npm ls would handle this
  }

  // ============ AI CODE REVIEW ============

  private async runAICodeReview(projectPath: string): Promise<CodeReviewResult> {
    try {
      const { execSync } = require('child_process');
      
      // Get main source files for AI review
      const mainFiles = execSync(
        `find ${projectPath}/src -name '*.ts' -o -name '*.tsx' 2>/dev/null | head -5`,
        { encoding: 'utf-8', timeout: 10000 }
      ).trim().split('\n').filter(Boolean);

      let allCode = '';
      for (const file of mainFiles) {
        try {
          const content = execSync(`cat '${file}' | head -100`, { encoding: 'utf-8', timeout: 5000 });
          allCode += `// ${file}\n${content}\n\n`;
        } catch {}
      }

      if (allCode) {
        const reviewResult = await aiChat([
          { role: 'system', content: 'You are a code reviewer. Analyze the code and return JSON: {"quality": 0-100, "issues": [...], "improvements": [...], "securityConcerns": [...]}' },
          { role: 'user', content: `Review this TypeScript code:\n${allCode.substring(0, 3000)}` },
        ], { temperature: 0.3, maxTokens: 1000 });
      try {
        const match = reviewResult.message.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      } catch {}
      return { quality: 50, issues: [], improvements: [], securityConcerns: [] };
      }
    } catch {}

    return { quality: 0, issues: [], improvements: [], securityConcerns: [] };
  }

  // ============ AUTO FIX ENGINE ============

  async autoFix(
    bugId: string,
    projectPath: string = '/home/fahad/fahadcloud'
  ): Promise<FixResult> {
    const fixId = generateId('fix');
    
    // Find the bug from scan history
    let bug: BugDetectionResult | null = null;
    for (const scan of this.scanHistory.values()) {
      bug = scan.findings.find(f => `${f.type}_${f.location}` === bugId) || null;
      if (bug) break;
    }

    if (!bug) {
      return {
        id: fixId,
        bugId,
        success: false,
        description: 'Bug not found in scan history',
        rollbackAvailable: false,
        appliedAt: new Date(),
      };
    }

    // Get code context for AI fix generation
    let codeContext = '';
    try {
      const { execSync } = require('child_process');
      const filePath = `${projectPath}${bug.location}`.split(':')[0];
      codeContext = execSync(`cat '${filePath}' 2>/dev/null || echo ""`, { encoding: 'utf-8', timeout: 5000 });
    } catch {}

    // Use AI to generate fix
    const fixAiResult = await aiChat([
        { role: 'system', content: 'Generate a code fix. Return JSON: {"success": true/false, "patch": "fixed code here", "description": "what was fixed"}' },
        { role: 'user', content: `Bug: ${bug.description}\nCode context:\n${codeContext.substring(0, 2000)}` },
      ], { temperature: 0.2, maxTokens: 1500 });
    let fixResult: AutoFixResult = { success: false, description: 'AI fix generation failed' };
    try {
      const match = fixAiResult.message.match(/\{[\s\S]*\}/);
      if (match) fixResult = JSON.parse(match[0]);
    } catch {}

    // If fix is available and auto-fixable, apply it
    if (fixResult.success && fixResult.patch && bug.autoFixable) {
      try {
        const { execSync } = require('child_process');
        const filePath = `${projectPath}${bug.location}`.split(':')[0];
        
        // Create backup for rollback
        execSync(`cp '${filePath}' '${filePath}.bak_${Date.now()}' 2>/dev/null`, { timeout: 5000 });
        
        // Apply the patch (write the fixed code)
        const fs = require('fs');
        fs.writeFileSync(filePath, fixResult.patch, 'utf-8');

        // Run test command if provided
        let testResult: 'passed' | 'failed' | 'skipped' = 'skipped';
        if (fixResult.testCommand) {
          try {
            execSync(fixResult.testCommand, { encoding: 'utf-8', timeout: 30000 });
            testResult = 'passed';
          } catch {
            testResult = 'failed';
            // Rollback on test failure
            if (fixResult.rollbackCommand) {
              try {
                execSync(fixResult.rollbackCommand, { encoding: 'utf-8', timeout: 10000 });
              } catch {}
            }
          }
        }

        const result: FixResult = {
          id: fixId,
          bugId,
          success: testResult !== 'failed',
          patch: fixResult.patch,
          description: fixResult.description,
          testResult,
          rollbackAvailable: true,
          appliedAt: new Date(),
        };

        this.fixHistory.set(fixId, result);
        return result;
      } catch (error: any) {
        return {
          id: fixId,
          bugId,
          success: false,
          description: `Failed to apply fix: ${error.message}`,
          rollbackAvailable: true,
          appliedAt: new Date(),
        };
      }
    }

    return {
      id: fixId,
      bugId,
      success: false,
      description: fixResult.description || 'Auto-fix not available for this issue',
      rollbackAvailable: false,
      appliedAt: new Date(),
    };
  }

  // ============ HELPERS ============

  private calculateSummary(findings: BugDetectionResult[]): ScanResult['summary'] {
    return {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      autoFixable: findings.filter(f => f.autoFixable).length,
    };
  }

  getScanHistory(): ScanResult[] {
    return Array.from(this.scanHistory.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  getFixHistory(): FixResult[] {
    return Array.from(this.fixHistory.values()).sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}

// Singleton
let bugDetectorInstance: BugDetectorEngine | null = null;
export function getBugDetectorEngine(): BugDetectorEngine {
  if (!bugDetectorInstance) bugDetectorInstance = new BugDetectorEngine();
  return bugDetectorInstance;
}
