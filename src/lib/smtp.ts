// ============================================
// FahadCloud SMTP Email Utility v2.0
// Enhanced deliverability, proper headers, DKIM-ready
// ============================================

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { appConfig } from '@/lib/config/app.config';

// ============ CONFIG LOADER ============

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

interface OwnerConfig {
  ownerEmail: string;
}

function parseEnvFile(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function loadSmtpConfig(): SmtpConfig {
  const projectRoot = process.cwd();
  // Check multiple config paths
  const envPaths = [
    join(projectRoot, 'smtp-setup', 'smtp-config.env'),
    join(projectRoot, 'smtp-config.env'),
  ];
  
  let env: Record<string, string> = {};
  for (const p of envPaths) {
    const parsed = parseEnvFile(p);
    if (Object.keys(parsed).length > 0) {
      env = parsed;
      break;
    }
  }

  return {
    host: env.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT || process.env.SMTP_PORT || '587', 10),
    secure: (env.SMTP_SECURE || process.env.SMTP_SECURE) === 'true',
    user: env.SMTP_USER || process.env.SMTP_USER || '',
    pass: (env.SMTP_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    fromName: env.SMTP_FROM_NAME || process.env.SMTP_FROM_NAME || 'FahadCloud',
    fromEmail: env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || env.SMTP_USER || process.env.SMTP_USER || '',
  };
}

export function loadOwnerConfig(): OwnerConfig {
  const projectRoot = process.cwd();
  const envPaths = [
    join(projectRoot, 'smtp-setup', 'owner-config.env'),
    join(projectRoot, 'owner-config.env'),
  ];
  
  let env: Record<string, string> = {};
  for (const p of envPaths) {
    const parsed = parseEnvFile(p);
    if (Object.keys(parsed).length > 0) {
      env = parsed;
      break;
    }
  }

  return {
    ownerEmail: (env.OWNER_EMAIL || process.env.OWNER_EMAIL || '').toLowerCase().trim(),
  };
}

// ============ TRANSPORTER ============

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const config = loadSmtpConfig();

  if (!config.user || !config.pass) {
    throw new Error('SMTP credentials not configured. Check smtp-setup/smtp-config.env');
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: true,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: config.user,
      pass: config.pass.replace(/\s+/g, ''),
    },
  });

  return cachedTransporter;
}

export function resetTransporter(): void {
  if (cachedTransporter) {
    cachedTransporter.close();
    cachedTransporter = null;
  }
}

// ============ EMAIL SENDER (ENHANCED) ============

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = loadSmtpConfig();
    const transporter = getTransporter();

    const result = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      replyTo: options.replyTo || config.fromEmail,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Mailer': 'FahadCloud Mailer v2.0',
        'X-Priority': '1',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN',
        'List-Unsubscribe': `<mailto:${config.fromEmail}?subject=unsubscribe>`,
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': `fc-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      },

    });

    console.log(`[SMTP] Email sent to ${options.to}, messageId: ${result.messageId}, response: ${result.response}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('[SMTP] Send error:', error.message, '| To:', options.to);
    return { success: false, error: error.message };
  }
}

// ============ TEST CONNECTION ============

export async function testSmtpConnection(): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    const config = loadSmtpConfig();
    
    if (!config.user || !config.pass) {
      return { success: false, error: 'SMTP credentials not configured', details: 'Check smtp-setup/smtp-config.env' };
    }

    console.log('[SMTP TEST] Testing connection to', config.host + ':' + config.port, 'as', config.user);
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: true,
      connectionTimeout: 15000,
      auth: {
        user: config.user,
        pass: config.pass.replace(/\s+/g, ''),
      },
    });

    await transporter.verify();
    console.log('[SMTP TEST] Connection verified successfully!');
    transporter.close();
    
    return { success: true, details: 'Connected to ' + config.host + ':' + config.port + ' as ' + config.user };
  } catch (error: any) {
    console.error('[SMTP TEST] Connection failed:', error.message);
    return { success: false, error: error.message, details: 'Failed to connect: ' + error.message };
  }
}

// ============ OTP EMAIL ============

export async function sendOtpEmail(toEmail: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px; }
        .otp-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669; text-align: center; padding: 20px; background: #ecfdf5; border-radius: 12px; border: 2px dashed #059669; margin: 16px 0; }
        .warning { color: #dc2626; font-size: 13px; text-align: center; margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 8px; }
        .footer { text-align: center; padding: 20px 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .footer a { color: #059669; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FahadCloud</h1>
          <p>Admin Login Verification</p>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 16px;">Hello Admin,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            You requested access to the FahadCloud Admin Panel. Use the verification code below to complete your login:
          </p>
          <div class="otp-label" style="text-align: center;">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <p style="color: #475569; font-size: 13px; text-align: center;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <div class="warning">
            If you did not request this code, please ignore this email. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          <p>FahadCloud AI-Powered Domain &amp; Hosting Platform</p>
          <p>This is an automated message from <a href="${appConfig.appUrl}">fahadcloud.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `FahadCloud Admin Login - Verification Code: ${otp}`,
    html,
    text: `Your FahadCloud admin verification code is: ${otp}. This code expires in 10 minutes. If you did not request this, ignore this email.`,
  });
}

// ============ WELCOME EMAIL ============

export async function sendWelcomeEmail(toEmail: string, name: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .body { padding: 40px; }
        .footer { text-align: center; padding: 20px 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FahadCloud!</h1>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 16px;">Hi ${name},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Your account has been created successfully on FahadCloud - the AI-Powered Domain &amp; Hosting Platform.
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            You can now register domains, deploy websites, manage hosting, and use our AI Cloud Engineer to automate your infrastructure.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${appConfig.appUrl}" style="background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>FahadCloud AI-Powered Domain &amp; Hosting Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: 'Welcome to FahadCloud - Your AI-Powered Cloud Platform',
    html,
  });
}

// ============ REGISTRATION VERIFICATION EMAIL ============

export async function sendRegistrationOtpEmail(toEmail: string, otp: string, name: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px; }
        .otp-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669; text-align: center; padding: 20px; background: #ecfdf5; border-radius: 12px; border: 2px dashed #059669; margin: 16px 0; }
        .warning { color: #dc2626; font-size: 13px; text-align: center; margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 8px; }
        .footer { text-align: center; padding: 20px 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .footer a { color: #059669; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FahadCloud</h1>
          <p>Email Verification Required</p>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 16px;">Hello ${name},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Thank you for registering on FahadCloud! To complete your account setup, please verify your email address by entering the code below:
          </p>
          <div class="otp-label" style="text-align: center;">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <p style="color: #475569; font-size: 13px; text-align: center;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <div class="warning">
            If you did not create an account on FahadCloud, please ignore this email. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          <p>FahadCloud AI-Powered Domain &amp; Hosting Platform</p>
          <p>This is an automated message from <a href="${appConfig.appUrl}">fahadcloud.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `FahadCloud - Verify Your Email (Code: ${otp})`,
    html,
    text: `Your FahadCloud email verification code is: ${otp}. This code expires in 10 minutes. If you did not create an account, ignore this email.`,
  });
}

// ============ ACTION VERIFICATION EMAIL ============

export async function sendActionVerificationEmail(toEmail: string, otp: string, action: string): Promise<{ success: boolean; error?: string }> {
  const actionLabels: Record<string, string> = {
    password_change: 'Password Change',
    email_change: 'Email Address Change',
    account_delete: 'Account Deletion',
    domain_transfer: 'Domain Transfer',
    hosting_delete: 'Hosting Environment Deletion',
  };

  const label = actionLabels[action] || action;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px; }
        .action-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .otp-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669; text-align: center; padding: 20px; background: #ecfdf5; border-radius: 12px; border: 2px dashed #059669; margin: 16px 0; }
        .warning { color: #dc2626; font-size: 13px; text-align: center; margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 8px; }
        .footer { text-align: center; padding: 20px 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .footer a { color: #059669; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FahadCloud Security</h1>
          <p>Action Verification Required</p>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 16px;">Hello,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            A security-sensitive action was requested on your account:
          </p>
          <div style="text-align: center;"><span class="action-badge">${label}</span></div>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            To confirm this action, please enter the verification code below:
          </p>
          <div class="otp-label" style="text-align: center;">Verification Code</div>
          <div class="otp-code">${otp}</div>
          <p style="color: #475569; font-size: 13px; text-align: center;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <div class="warning">
            If you did not request this action, do NOT share this code. Your account may be compromised - change your password immediately.
          </div>
        </div>
        <div class="footer">
          <p>FahadCloud AI-Powered Domain &amp; Hosting Platform</p>
          <p>This is an automated security message from <a href="${appConfig.appUrl}">fahadcloud.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `FahadCloud Security - ${label} Verification (Code: ${otp})`,
    html,
    text: `Your FahadCloud verification code for ${label} is: ${otp}. This code expires in 10 minutes. If you did not request this, secure your account immediately.`,
  });
}

// ============ PASSWORD RESET EMAIL ============

export async function sendPasswordResetEmail(toEmail: string, otp: string, name: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px; }
        .otp-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626; text-align: center; padding: 20px; background: #fef2f2; border-radius: 12px; border: 2px dashed #dc2626; margin: 16px 0; }
        .info-box { color: #1e40af; font-size: 13px; text-align: center; margin-top: 16px; padding: 12px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; }
        .warning { color: #dc2626; font-size: 13px; text-align: center; margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 8px; }
        .footer { text-align: center; padding: 20px 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .footer a { color: #059669; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FahadCloud Security</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="body">
          <p style="color: #334155; font-size: 16px;">Hello ${name},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            We received a request to reset your FahadCloud account password. Use the verification code below to proceed:
          </p>
          <div class="otp-label" style="text-align: center;">Your Password Reset Code</div>
          <div class="otp-code">${otp}</div>
          <p style="color: #475569; font-size: 13px; text-align: center;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <div class="info-box">
            After verifying this code, you will be able to set a new password for your account.
          </div>
          <div class="warning">
            If you did not request a password reset, please ignore this email. Your account is safe. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          <p>FahadCloud AI-Powered Domain &amp; Hosting Platform</p>
          <p>This is an automated security message from <a href="${appConfig.appUrl}">fahadcloud.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: 'FahadCloud - Password Reset Code: ' + otp,
    html,
    text: 'Your FahadCloud password reset code is: ' + otp + '. This code expires in 10 minutes. If you did not request a password reset, ignore this email.',
  });
}
