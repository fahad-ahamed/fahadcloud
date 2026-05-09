import { NextResponse } from 'next/server';
import { testSmtpConnection } from '@/lib/smtp';

export async function GET() {
  try {
    const result = await testSmtpConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
