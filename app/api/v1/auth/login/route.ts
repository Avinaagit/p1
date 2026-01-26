import { NextRequest, NextResponse } from 'next/server';
import { signToken, createAuthCookie, verifyToken, extractToken } from '../../../../_lib/auth';
import { handleError, successResponse } from '../../_middleware';
import prisma from '../../../../_lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/auth/login
 * Email/password login endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In production, use proper password hashing (bcrypt, argon2, etc.)
    // This is simplified for demo purposes
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User account is inactive' },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create response with auth cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
          },
          token,
        },
      },
      { status: 200 }
    );

    // Set HttpOnly cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/auth/google
 * Google OAuth login endpoint
 */
export async function POST_GOOGLE(req: NextRequest) {
  try {
    const { googleId, email, firstName, lastName } = await req.json();

    if (!googleId || !email) {
      return NextResponse.json(
        { success: false, error: 'Google ID and email required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          googleId,
          firstName: firstName || 'User',
          lastName: lastName || '',
          role: 'EMPLOYEE', // Default role for new users
        },
      });
    } else if (!user.googleId) {
      // Link Google ID to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User account is inactive' },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
          },
          token,
        },
      },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', createAuthCookie(token));
    return response;
  } catch (error) {
    return handleError(error);
  }
}
