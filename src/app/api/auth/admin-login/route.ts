// ============================================
// FahadCloud Admin Login - Request OTP
// ============================================
// POST /api/auth/admin-login
// Validates owner email and sends OTP via SMTP
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    const result = await authService.adminLoginRequest(email);

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin login request error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
