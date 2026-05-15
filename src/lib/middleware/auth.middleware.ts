import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { appConfig } from '@/lib/config/app.config';

export interface AuthResult {
  authenticated: boolean;
  user?: { userId: string; email: string; role: string };
  error?: string;
  status?: number;
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('fahadcloud-token')?.value;
    if (!token) return { authenticated: false, error: 'Not authenticated', status: 401 };

    const payload = await verifyToken(token);
    if (!payload) return { authenticated: false, error: 'Invalid or expired token', status: 401 };

    // Check if user is blocked in database (real-time check)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, emailVerified: true },
    });

    if (!user) return { authenticated: false, error: 'User not found', status: 401 };
    if (user.role === 'blocked') return { authenticated: false, error: 'Account has been blocked. Contact support.', status: 403 };

    return { authenticated: true, user: { userId: payload.userId, email: payload.email, role: user.role } };
  } catch {
    return { authenticated: false, error: 'Authentication failed', status: 401 };
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult;
  if (authResult.user!.role !== 'admin' && authResult.user!.role !== 'super_admin') {
    return { authenticated: false, error: 'Admin access required', status: 403 };
  }
  return authResult;
}

export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) return authResult;
  // Super admin = the configured owner email OR adminRole = super_admin
  const user = await db.user.findUnique({
    where: { id: authResult.user!.userId },
    select: { email: true, adminRole: true },
  });
  if (!user) return { authenticated: false, error: 'User not found', status: 401 };
  if (user.email !== appConfig.admin.superAdminEmail && user.adminRole !== 'super_admin') {
    return { authenticated: false, error: 'Super admin access required', status: 403 };
  }
  return authResult;
}

export async function requireRole(request: NextRequest, roles: string[]): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult;
  if (!roles.includes(authResult.user!.role)) {
    return { authenticated: false, error: 'Insufficient permissions', status: 403 };
  }
  return authResult;
}

export async function requireModerator(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, ['admin', 'super_admin', 'moderator']);
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

export function authErrorResponse(authResult: AuthResult): NextResponse {
  return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
}
