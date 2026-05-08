import { db } from '@/lib/db';

export interface RequestLog {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
  error?: string;
}

class LoggingService {
  private logs: RequestLog[] = [];
  private maxLogs = 1000;

  logRequest(log: RequestLog): void {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const status = log.statusCode >= 400 ? 'ERR' : 'OK';
      console.log(`[${status}] ${log.method} ${log.path} ${log.statusCode} ${log.duration}ms${log.userId ? ` user:${log.userId.substring(0, 8)}` : ''}`);
    }
  }

  getRecentLogs(limit: number = 100): RequestLog[] {
    return this.logs.slice(-limit);
  }

  getErrorLogs(limit: number = 50): RequestLog[] {
    return this.logs.filter(l => l.statusCode >= 400).slice(-limit);
  }

  getStats(): { total: number; errors: number; avgDuration: number } {
    const total = this.logs.length;
    const errors = this.logs.filter(l => l.statusCode >= 400).length;
    const avgDuration = total > 0 ? this.logs.reduce((sum, l) => sum + l.duration, 0) / total : 0;
    return { total, errors, avgDuration: Math.round(avgDuration) };
  }
}

export const loggingService = new LoggingService();

// Helper to measure API handler execution time
export function withLogging(handler: Function, path: string) {
  return async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await handler(...args);
      const duration = Date.now() - start;
      
      // Extract request info
      const request = args[0];
      const userId = undefined; // Will be set by auth middleware
      const ip = request?.headers?.get?.('x-forwarded-for') || request?.headers?.get?.('x-real-ip') || 'unknown';
      
      loggingService.logRequest({
        method: request?.method || 'UNKNOWN',
        path,
        statusCode: result?.status || 200,
        duration,
        ip,
        userAgent: request?.headers?.get?.('user-agent') || undefined,
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      loggingService.logRequest({
        method: args[0]?.method || 'UNKNOWN',
        path,
        statusCode: 500,
        duration,
        error: error.message,
      });
      throw error;
    }
  };
}
