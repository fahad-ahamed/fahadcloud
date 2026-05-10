// ============ BULLMQ QUEUE SYSTEM - Heavy AI Task Processing ============
import { Queue, Worker, Job } from 'bullmq';

// ============ QUEUE DEFINITIONS ============
export const QUEUES = {
  AI_TASK: 'fc_ai_tasks',
  BUG_SCAN: 'fc_bug_scans',
  AUTO_FIX: 'fc_auto_fixes',
  AI_LEARNING: 'fc_ai_learning',
  BACKUP: 'fc_backups',
  DEPLOYMENT: 'fc_deployments',
  NOTIFICATION: 'fc_notifications',
} as const;

const connection = {
  host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || '127.0.0.1',
  port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
};

// Lazy queue creation to avoid module-level instantiation errors
function createQueue(name: string): Queue {
  return new Queue(name, { connection });
}

export function getAITaskQueue() { return createQueue(QUEUES.AI_TASK); }
export function getBugScanQueue() { return createQueue(QUEUES.BUG_SCAN); }
export function getAutoFixQueue() { return createQueue(QUEUES.AUTO_FIX); }
export function getAILearningQueue() { return createQueue(QUEUES.AI_LEARNING); }
export function getBackupQueue() { return createQueue(QUEUES.BACKUP); }
export function getDeploymentQueue() { return createQueue(QUEUES.DEPLOYMENT); }
export function getNotificationQueue() { return createQueue(QUEUES.NOTIFICATION); }

// ============ JOB TYPES ============
export interface AITaskJob {
  taskId: string;
  userId: string;
  agentType: string;
  action: string;
  input: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface BugScanJob {
  scanId: string;
  userId: string;
  scope: 'full' | 'quick' | 'targeted';
  targetPath?: string;
}

export interface AutoFixJob {
  bugReportId: string;
  bugType: string;
  filePath?: string;
  suggestedFix?: string;
}

export interface AILearningJob {
  sessionId: string;
  userId: string;
  topic: string;
  depth: 'quick' | 'standard' | 'deep';
}

export interface BackupJob {
  backupId: string;
  type: 'scheduled' | 'manual' | 'pre_migration';
  tables?: string[];
}

// ============ QUEUE HELPER ============
export class QueueManager {
  private queues: Map<string, Queue> = new Map();

  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Queue(queueName, { connection }));
    }
    return this.queues.get(queueName)!;
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: { priority?: number; delay?: number; attempts?: number; backoff?: number }
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, {
      priority: options?.priority || 5,
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      backoff: { type: 'exponential', delay: options?.backoff || 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }

  async getQueueStatus(queueName: string) {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(), queue.getActiveCount(), queue.getCompletedCount(),
      queue.getFailedCount(), queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  async getAllQueuesStatus() {
    const statuses: Record<string, any> = {};
    for (const [name, queueName] of Object.entries(QUEUES)) {
      try { statuses[name] = await this.getQueueStatus(queueName); } catch { statuses[name] = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }; }
    }
    return statuses;
  }

  async getFailedJobs(queueName: string, limit: number = 10) {
    return this.getQueue(queueName).getFailed(limit);
  }

  async retryJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) await job.retry();
  }

  async cleanQueue(queueName: string, grace: number = 86400000) {
    const queue = this.getQueue(queueName);
    await queue.clean(grace, 1000, 'completed');
    await queue.clean(grace, 1000, 'failed');
  }
}

export const queueManager = new QueueManager();
