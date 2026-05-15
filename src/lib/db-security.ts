// ============ DATABASE SECURITY MODULE v2.0 ============
import { db } from "./db";
import { auditLogger } from "./audit-logger";
import { appConfig } from "./config/app.config";
import * as bcrypt from "bcryptjs";

// ============ PASSWORD SECURITY ============
export class PasswordSecurity {
  private static SALT_ROUNDS = 14; // Increased from 12 to 14 for stronger hashing

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validateStrength(password: string): { valid: boolean; strength: number; issues: string[] } {
    const issues: string[] = [];
    let strength = 0;
    
    if (password.length < 8) issues.push("Password must be at least 8 characters");
    else if (password.length >= 12) strength++;
    
    if (!/[A-Z]/.test(password)) issues.push("Must contain uppercase letter");
    else strength++;
    
    if (!/[a-z]/.test(password)) issues.push("Must contain lowercase letter");
    else strength++;
    
    if (!/[0-9]/.test(password)) issues.push("Must contain a number");
    else strength++;
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) issues.push("Must contain special character");
    else strength++;
    
    // Common password blocklist
    const common = ["password", "12345678", "qwerty123", "admin123", "letmein", "welcome1", "abc123456", "password1"];
    if (common.includes(password.toLowerCase())) {
      issues.push("This password is too common");
      return { valid: false, strength: 1, issues };
    }
    
    return { valid: issues.length === 0, strength: Math.min(strength, 5), issues };
  }
}

// ============ API RATE LIMITER ============
export class APIRateLimiter {
  static async checkLimit(
    identifier: string,
    action: string,
    maxRequests: number = 100,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    // Use Redis-based rate limiting
    try {
      const { redisRateLimit } = await import("@/lib/redis-rateLimit");
      const result = await redisRateLimit(identifier, action, { maxRequests, windowSeconds });
      return { allowed: result.allowed, remaining: result.remaining, resetAt: Date.now() + result.resetIn * 1000 };
    } catch {
      return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 };
    }
  }

  static async checkAuthLimit(ip: string): Promise<boolean> {
    const result = await this.checkLimit(ip, "auth", 5, 300);
    return result.allowed;
  }

  static async checkAPILimit(userId: string): Promise<boolean> {
    const result = await this.checkLimit(userId, "api", 200, 60);
    return result.allowed;
  }
}

// ============ ROW-LEVEL SECURITY ============
export class RowLevelSecurity {
  static userDataFilter(userId: string, role: string) {
    if (role === "admin" || role === "super_admin") return {};
    return { userId };
  }

  static domainAccessFilter(userId: string, role: string) {
    if (role === "admin" || role === "super_admin") return {};
    return { userId };
  }

  static agentSessionFilter(userId: string, role: string) {
    if (role === "admin" || role === "super_admin") return {};
    return { userId };
  }

  static canAccess(userRole: string, resource: string, action: string): boolean {
    const permissions: Record<string, Record<string, string[]>> = {
      customer: {
        user: ["read", "update_own"],
        domain: ["read", "create", "update_own", "delete_own"],
        hosting: ["read", "create", "update_own", "delete_own"],
        agent: ["read", "create", "update_own"],
        order: ["read", "create_own"],
        payment: ["read", "create_own"],
        storage: ["read", "create", "update_own", "delete_own"],
      },
      admin: {
        user: ["read", "create", "update", "delete", "block"],
        domain: ["read", "create", "update", "delete"],
        hosting: ["read", "create", "update", "delete"],
        agent: ["read", "create", "update", "delete", "admin_control"],
        order: ["read", "create", "update", "delete"],
        payment: ["read", "create", "update", "delete", "verify"],
        storage: ["read", "create", "update", "delete"],
        system: ["read", "update", "manage"],
      },
      super_admin: {
        "*": ["*"],
      },
    };
    const rolePerms = permissions[userRole];
    if (!rolePerms) return false;
    const resourcePerms = rolePerms[resource] || rolePerms["*"];
    if (!resourcePerms) return false;
    return resourcePerms.includes("*") || resourcePerms.includes(action);
  }
}

// ============ INPUT SANITIZATION ============
export class InputSecurity {
  static sanitize(input: string): string {
    return input
      .trim()
      .replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<\s*iframe[^>]*>.*?<\s*\/\s*iframe>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/data\s*:\s*text\/html/gi, "");
  }

  static isValidJson(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}



// ============ BACKUP AUTOMATION ============
export class BackupAutomation {
  static async createBackup(type: string = "scheduled", tables?: string[]): Promise<any> {
    try {
      const backupDir = `${appConfig.projectRoot}/backups`;
      const { execSync } = require("child_process");
      const fs = require("fs");
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `backup-${type}-${timestamp}.sql`;
      const filePath = `${backupDir}/${fileName}`;
      const tablesIncluded = tables ? JSON.stringify(tables) : "[]";
      const backup = await db.databaseBackup.create({
        data: { type, status: "running", filePath, tablesIncluded, startedAt: new Date() },
      });
      return { success: true, backupId: backup.id, fileName };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  static async listBackups(limit: number = 20) {
    return db.databaseBackup.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  }
  static async cleanupOldBackups(keepCount: number = 10) {
    const backups = await db.databaseBackup.findMany({ orderBy: { createdAt: "desc" }, select: { id: true } });
    if (backups.length <= keepCount) return 0;
    const toDelete = backups.slice(keepCount);
    await db.databaseBackup.deleteMany({ where: { id: { in: toDelete.map((b: any) => b.id) } } });
    return toDelete.length;
  }
}

// ============ DATABASE HEALTH CHECK ============
export async function checkDatabaseHealth() {
  const start = Date.now();
  try {
    await db.$executeRawUnsafe("SELECT 1");
    const latency = Date.now() - start;
    const sizeResult: any = await db.$queryRawUnsafe("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    const tableCount: any = await db.$queryRawUnsafe("SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'");
    const connCount: any = await db.$queryRawUnsafe("SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()");
    return {
      status: "healthy", latency,
      size: sizeResult?.[0]?.size || "unknown",
      tables: tableCount?.[0]?.count || 0,
      connections: connCount?.[0]?.count || 0,
    };
  } catch (error) {
    return { status: "unhealthy", latency: Date.now() - start, size: "unknown", tables: 0, connections: 0 };
  }
}

// ============ REDIS RE-EXPORTS ============
export { redisRateLimit, resetRateLimit } from "./redis-rateLimit";
export { redis } from "./redis";

