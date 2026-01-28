import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/_lib/jwt';
import { prisma } from '@/app/_lib/prisma';

// POST - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ message: 'Буруу токен' }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: payload.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} мэдэгдэл унших болгов`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Mark all as read error:', error);
    return NextResponse.json(
      { message: 'Алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
