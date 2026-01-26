import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../../_lib/auth';
import { getUserContext } from '../../../../_lib/dal';
import { handleError, successResponse } from '../../_middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return successResponse({
      user: userContext,
    });
  } catch (error) {
    return handleError(error);
  }
}
