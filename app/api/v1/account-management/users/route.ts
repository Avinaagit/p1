import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';
import { prisma } from '@/app/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext || userContext.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    console.error('Account management users error:', error);
    return NextResponse.json(
      { message: 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
