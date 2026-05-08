import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

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

    return { authenticated: true, user: { userId: payload.userId, email: payload.email, role: payload.role } };
  } catch {
    return { authenticated: false, error: 'Authentication failed', status: 401 };
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult;
  if (authResult.user!.role !== 'admin') {
    return { authenticated: false, error: 'Admin access required', status: 403 };
  }
  return authResult;
}

export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAdmin(request);
  if (!authResult.authenticated) return authResult;
  if (authResult.user!.email !== 'admin@fahadcloud.com' && authResult.user!.role !== 'super_admin') {
    return { authenticated: false, error: 'Super admin access required', status: 403 };
  }
  return authResult;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

export function authErrorResponse(authResult: AuthResult): NextResponse {
  return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
}
