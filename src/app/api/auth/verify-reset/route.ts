import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const result = await authService.verifyPasswordReset(email, otp);

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    return NextResponse.json({
      message: result.message,
      resetToken: result.resetToken,
      email: result.email,
    });
  } catch (error: any) {
    console.error('Password reset verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify reset code. Please try again.' },
      { status: 500 }
    );
  }
}
