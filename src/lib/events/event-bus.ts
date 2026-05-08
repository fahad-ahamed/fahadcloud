type EventHandler = (event: AppEvent) => void | Promise<void>;

export interface AppEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source?: string;
}

class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private globalHandlers: EventHandler[] = [];
  private eventLog: AppEvent[] = [];
  private maxLogSize = 1000;

  // Subscribe to specific event types
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  // Subscribe to ALL events
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);
    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) this.globalHandlers.splice(index, 1);
    };
  }

  // Emit an event
  async emit(eventType: string, payload: any, source?: string): Promise<void> {
    const event: AppEvent = { type: eventType, payload, timestamp: new Date(), source };

    // Log the event
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Call specific handlers
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler error for ${eventType}:`, error);
      }
    }

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Global event handler error:`, error);
      }
    }
  }

  // Get event log
  getEventLog(limit: number = 100): AppEvent[] {
    return this.eventLog.slice(-limit);
  }

  // Get events by type
  getEventsByType(eventType: string, limit: number = 50): AppEvent[] {
    return this.eventLog.filter(e => e.type === eventType).slice(-limit);
  }
}

// Singleton event bus
export const eventBus = new EventBus();

// Event type constants for type safety
export const EventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_VERIFIED: 'user.verified',

  // Domain events
  DOMAIN_REGISTERED: 'domain.registered',
  DOMAIN_DELETED: 'domain.deleted',
  DOMAIN_RENEWED: 'domain.renewed',

  // Payment events
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_APPROVED: 'payment.approved',
  PAYMENT_REJECTED: 'payment.rejected',
  PAYMENT_VERIFIED: 'payment.verified',

  // Hosting events
  HOSTING_CREATED: 'hosting.created',
  HOSTING_DEPLOYED: 'hosting.deployed',
  HOSTING_DELETED: 'hosting.deleted',

  // SSL events
  SSL_ISSUED: 'ssl.issued',
  SSL_RENEWED: 'ssl.renewed',

  // File events
  FILE_UPLOADED: 'file.uploaded',
  FILE_DELETED: 'file.deleted',

  // System events
  SYSTEM_ALERT: 'system.alert',
  SYSTEM_ERROR: 'system.error',
} as const;
