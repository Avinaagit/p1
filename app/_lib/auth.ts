import { jwtVerify, SignJWT } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-min-32-chars'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  department?: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRATION || '7d')
    .sign(secret);

  return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return {
      userId: verified.payload.userId as string,
      email: verified.payload.email as string,
      role: verified.payload.role as string,
      department: verified.payload.department as string | undefined,
      iat: verified.payload.iat,
      exp: verified.payload.exp,
    };
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

/**
 * Extract token from cookie or Authorization header
 */
export function extractToken(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try cookies
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    return cookies['auth-token'] || null;
  }

  return null;
}

/**
 * Create HTTP-Only cookie value with token
 */
export function createAuthCookie(token: string) {
  return `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`;
}

/**
 * Create logout cookie (expires immediately)
 */
export function createLogoutCookie() {
  return `auth-token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
