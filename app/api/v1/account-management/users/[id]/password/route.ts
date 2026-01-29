import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';
import { prisma } from '@/app/_lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const isPasswordValid = (password: string) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/\-_=+;'`~]/.test(password)) return false;
  return true;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext || userContext.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const password = String(body?.password || '');

    if (!isPasswordValid(password)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Нууц үг нь хамгийн багадаа 8 тэмдэгттэй, 1 том үсэг, 1 жижиг үсэг, 1 тусгай тэмдэг агуулсан байх ёстой',
        },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true, message: 'Нууц үг солигдлоо' }, { status: 200 });
  } catch (error: any) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { message: 'Нууц үг солиход алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
