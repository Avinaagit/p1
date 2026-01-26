import { NextRequest, NextResponse } from 'next/server';
import { createLogoutCookie } from '../../../../_lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/auth/logout
 * Logout endpoint - clears auth cookie
 */
export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', createLogoutCookie());

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
