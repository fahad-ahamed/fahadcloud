import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection } from '@/lib/smtp';
import { requireAdmin, authErrorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication to test SMTP
    const auth = await requireAdmin(request);
    if (!auth.authenticated) {
      return authErrorResponse(auth);
    }

    const result = await testSmtpConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SMTP test failed' },
      { status: 500 }
    );
  }
}
