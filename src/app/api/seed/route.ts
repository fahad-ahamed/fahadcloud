import { NextResponse } from 'next/server';

// This route has been disabled for security reasons.
// Admin account creation is now handled through the SMTP OTP system.
// Do not re-enable - the seed route created demo accounts with weak passwords.

export async function POST() {
  return NextResponse.json(
    { 
      error: 'This route has been disabled', 
      message: 'Seed route is no longer available. Admin accounts are created via SMTP OTP verification system.',
      code: 'ROUTE_DISABLED' 
    }, 
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This route has been disabled', 
      message: 'Seed route is no longer available. Admin accounts are created via SMTP OTP verification system.',
      code: 'ROUTE_DISABLED' 
    }, 
    { status: 403 }
  );
}

