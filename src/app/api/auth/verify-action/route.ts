import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { authService } from '@/lib/services';

// POST: Request an action verification OTP
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const body = await request.json();
    const { action, metadata } = body;

    const result = await authService.requestActionVerification(currentUser.userId, action, metadata, ip);

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Action verification request error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code.' },
      { status: 500 }
    );
  }
}

// PUT: Verify an action OTP and execute the action
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { action, otp } = body;

    const result = await authService.verifyAction(currentUser.userId, action, otp);

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Action verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed.' },
      { status: 500 }
    );
  }
}
