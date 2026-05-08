import { db } from '@/lib/db';
import { BaseRepository } from './base.repository';

export class AgentRepository extends BaseRepository<any> {
  protected model = db.agentSession;

  async findSessionWithMessages(sessionId: string) {
    return db.agentSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });
  }

  async createUserSession(userId: string, title: string) {
    return db.agentSession.create({
      data: { userId, title, context: JSON.stringify({}) },
    });
  }

  async addMessage(data: { sessionId: string; role: string; content: string; toolCalls?: string; toolResults?: string; metadata?: string }) {
    return db.agentMessage.create({ data });
  }

  async getSessionHistory(sessionId: string, limit: number = 50) {
    return db.agentMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async findUserTasks(userId: string, params?: { status?: string; type?: string }) {
    const { status, type } = params || {};
    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;
    return db.agentTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { logs: { orderBy: { step: 'asc' } } },
    });
  }

  async logToolExecution(data: { userId: string; taskId?: string; sessionId?: string; tool: string; input: string; output?: string; status: string; riskLevel: string }) {
    return db.agentToolExecution.create({ data });
  }
}

export const agentRepository = new AgentRepository();
