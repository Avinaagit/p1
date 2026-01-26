import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../_lib/auth';
import { getUserContext } from '../../_lib/dal';

/**
 * Middleware for API route protection and user context extraction
 */
export async function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: { requiredRoles?: string[] } = {}
) {
  return async (req: NextRequest, context: any) => {
    try {
      const token = extractToken(req);
      const userContext = await getUserContext(token);

      if (!userContext) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      // Check role if required
      if (options.requiredRoles && !options.requiredRoles.includes(userContext.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      // Attach user context to request for use in handler
      (req as any).userContext = userContext;

      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Centralized error handler for API routes
 */
export function handleError(error: any, statusCode = 500) {
  console.error('API Error:', error);

  let message = 'Internal server error';

  if (error instanceof Error) {
    message = error.message;
  }

  if (error.code === 'P2025') {
    // Prisma "not found" error
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
  }

  if (error.code === 'P2002') {
    // Prisma unique constraint error
    return NextResponse.json(
      { success: false, error: 'Resource already exists' },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { success: false, error: message },
    { status: statusCode }
  );
}

/**
 * Success response formatter
 */
export function successResponse<T>(data: T, statusCode = 200) {
  return NextResponse.json({ success: true, data }, { status: statusCode });
}

/**
 * Paginated response formatter
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  statusCode = 200
) {
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    },
    { status: statusCode }
  );
}
