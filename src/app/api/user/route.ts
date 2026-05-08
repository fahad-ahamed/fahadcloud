import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { userService } from '@/lib/services';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await userService.getProfile(currentUser.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, company, phone, address, city, country, currentPassword, newPassword } = body;

    // Validate that at least some fields are provided for profile update
    if (!currentPassword && !newPassword) {
      const hasUpdateFields = firstName !== undefined || lastName !== undefined ||
        company !== undefined || phone !== undefined || address !== undefined ||
        city !== undefined || country !== undefined;

      if (!hasUpdateFields) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }
    }

    const result = await userService.updateProfile(currentUser.userId, {
      firstName, lastName, company, phone, address, city, country,
      currentPassword, newPassword,
    });

    if (result.error) {
      const { status, ...errorBody } = result as any;
      return NextResponse.json(errorBody, { status: status || 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await userService.deleteAccount(currentUser.userId);

    const response = NextResponse.json({ message: 'Account deleted successfully' });
    response.cookies.set('fahadcloud-token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
