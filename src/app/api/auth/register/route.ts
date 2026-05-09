import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const body = await request.json();
    const { email, password, firstName, lastName, company, phone, address, city, country } = body;

    console.log('[REGISTER] Request received:', { email, firstName, lastName, hasPassword: !!password });

    const result = await authService.register(
      { email, password, firstName, lastName, company, phone, address, city, country },
      ip
    );

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    const { status, ...successBody } = result as any;

    return NextResponse.json(successBody, { status: status || 201 });
  } catch (error: any) {
    console.error('[REGISTER] Full error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
