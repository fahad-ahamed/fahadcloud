// ============================================
// FahadCloud Admin Login - Verify OTP
// ============================================
// POST /api/auth/admin-verify
// Verifies OTP and issues admin JWT token
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    const result = await authService.adminLoginVerify(email, otp);

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    const { token, ...successBody } = result as any;

    const response = NextResponse.json(successBody);

    response.cookies.set('fahadcloud-token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
