// ============ AUDIT LOGGER - Database Security & Compliance ============
import { db } from './db';

export type AuditCategory = 'auth' | 'data_access' | 'modification' | 'deletion' | 'system' | 'ai_agent' | 'security';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export class AuditLogger {
  // Log an audit event
  async log(params: {
    userId?: string;
    action: string;
    category: AuditCategory;
    targetType?: string;
    targetId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    riskLevel?: RiskLevel;
  }): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          category: params.category,
          targetType: params.targetType,
          targetId: params.targetId,
          details: params.details,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          riskLevel: params.riskLevel || 'low',
        },
      });
    } catch (error: any) {
      console.error('AuditLogger error:', error.message);
    }
  }

  // Log authentication events
  async logAuth(userId: string, action: string, ipAddress?: string, userAgent?: string, success: boolean = true) {
    await this.log({
      userId,
      action,
      category: 'auth',
      details: JSON.stringify({ success }),
      ipAddress,
      userAgent,
      riskLevel: success ? 'low' : 'medium',
    });
  }

  // Log data access
  async logDataAccess(userId: string, resource: string, resourceId: string, action: string, ipAddress?: string) {
    await this.log({
      userId,
      action: `${action}:${resource}`,
      category: 'data_access',
      targetType: resource,
      targetId: resourceId,
      ipAddress,
      riskLevel: 'low',
    });
  }

  // Log data modification
  async logModification(userId: string, resource: string, resourceId: string, changes: any, ipAddress?: string) {
    await this.log({
      userId,
      action: `modify:${resource}`,
      category: 'modification',
      targetType: resource,
      targetId: resourceId,
      details: JSON.stringify(changes),
      ipAddress,
      riskLevel: 'medium',
    });
  }

  // Log deletion
  async logDeletion(userId: string, resource: string, resourceId: string, details?: string, ipAddress?: string) {
    await this.log({
      userId,
      action: `delete:${resource}`,
      category: 'deletion',
      targetType: resource,
      targetId: resourceId,
      details,
      ipAddress,
      riskLevel: 'high',
    });
  }

  // Log AI agent actions
  async logAgentAction(userId: string, agentType: string, action: string, details: any, riskLevel: RiskLevel = 'low') {
    await this.log({
      userId,
      action: `agent:${agentType}:${action}`,
      category: 'ai_agent',
      details: JSON.stringify(details),
      riskLevel,
    });
  }

  // Log security events
  async logSecurity(action: string, details: any, riskLevel: RiskLevel = 'high', ipAddress?: string) {
    await this.log({
      action,
      category: 'security',
      details: JSON.stringify(details),
      ipAddress,
      riskLevel,
    });

    // Also create a security alert for high/critical events
    if (riskLevel === 'high' || riskLevel === 'critical') {
      try {
        await db.securityAlert.create({
          data: {
            type: action.includes('brute') ? 'brute_force' : 
                  action.includes('intrusion') ? 'intrusion_attempt' :
                  action.includes('breach') ? 'data_breach' : 'suspicious_activity',
            severity: riskLevel,
            source: ipAddress,
            details: JSON.stringify(details),
          },
        });
      } catch {}
    }
  }

  // Get audit logs with filtering
  async getLogs(filters: {
    userId?: string;
    category?: AuditCategory;
    action?: string;
    riskLevel?: RiskLevel;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.category) where.category = filters.category;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      db.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // Get security alerts
  async getSecurityAlerts(status?: string, limit: number = 20) {
    const where: any = {};
    if (status) where.status = status;

    return db.securityAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const auditLogger = new AuditLogger();
