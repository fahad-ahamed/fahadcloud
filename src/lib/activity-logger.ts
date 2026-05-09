// User Activity Logger - Centralized logging for all user actions
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export type ActivityAction = 
  | 'login' | 'logout' | 'register' | 'email_verified'
  | 'page_view'
  | 'domain_search' | 'domain_register' | 'domain_delete' | 'domain_renew'
  | 'dns_record_add' | 'dns_record_update' | 'dns_record_delete'
  | 'hosting_create' | 'hosting_restart' | 'hosting_delete'
  | 'file_upload' | 'file_delete' | 'file_download'
  | 'terminal_command'
  | 'ai_chat' | 'ai_deploy' | 'ai_execute' | 'ai_task_approve' | 'ai_task_cancel'
  | 'payment_create' | 'payment_verify'
  | 'ssl_install' | 'ssl_check'
  | 'deploy_start' | 'deploy_complete' | 'deploy_fail'
  | 'profile_update' | 'password_change' | 'account_delete'
  | 'storage_view';

export type ActivityCategory = 
  | 'auth' | 'domains' | 'dns' | 'hosting' | 'storage' | 'terminal' 
  | 'ai' | 'payments' | 'ssl' | 'deploy' | 'profile';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  category: ActivityCategory;
  details?: any;
  request?: NextRequest;
  metadata?: any;
}

export async function logUserActivity({ userId, action, category, details, request, metadata }: LogActivityParams): Promise<void> {
  try {
    await db.userActivityLog.create({
      data: {
        userId,
        action,
        category,
        details: details ? JSON.stringify(details) : null,
        ipAddress: request ? (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') : null,
        userAgent: request ? (request.headers.get('user-agent') || null) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Silently fail - activity logging should never break the main flow
    console.error('Activity logging failed:', error);
  }
}

// Quick helpers for common actions
export const ActivityLog = {
  login: (userId: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'login', category: 'auth', request }),
  
  logout: (userId: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'logout', category: 'auth', request }),
  
  register: (userId: string, email: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'register', category: 'auth', details: { email }, request }),
  
  domainSearch: (userId: string, domain: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'domain_search', category: 'domains', details: { domain }, request }),
  
  domainRegister: (userId: string, domain: string, price: number, request?: NextRequest) => 
    logUserActivity({ userId, action: 'domain_register', category: 'domains', details: { domain, price }, request }),
  
  hostingCreate: (userId: string, plan: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'hosting_create', category: 'hosting', details: { plan }, request }),
  
  fileUpload: (userId: string, fileName: string, size: number, request?: NextRequest) => 
    logUserActivity({ userId, action: 'file_upload', category: 'storage', details: { fileName, size }, request }),
  
  terminalCommand: (userId: string, command: string, isAdmin: boolean, request?: NextRequest) => 
    logUserActivity({ userId, action: 'terminal_command', category: 'terminal', details: { command: command.substring(0, 200), isAdmin }, request }),
  
  aiChat: (userId: string, message: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'ai_chat', category: 'ai', details: { message: message.substring(0, 100) }, request }),
  
  paymentCreate: (userId: string, amount: number, method: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'payment_create', category: 'payments', details: { amount, method }, request }),
  
  sslInstall: (userId: string, domain: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'ssl_install', category: 'ssl', details: { domain }, request }),
  
  deploy: (userId: string, domain: string, framework: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'deploy_start', category: 'deploy', details: { domain, framework }, request }),
  
  profileUpdate: (userId: string, fields: string[], request?: NextRequest) => 
    logUserActivity({ userId, action: 'profile_update', category: 'profile', details: { fields }, request }),
  
  passwordChange: (userId: string, request?: NextRequest) => 
    logUserActivity({ userId, action: 'password_change', category: 'profile', request }),
};
