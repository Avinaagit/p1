import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/_lib/jwt';
import { prisma } from '@/app/_lib/prisma';

// PATCH - Mark notification as read
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ message: 'Буруу токен' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ message: 'Мэдэгдэл олдсонгүй' }, { status: 404 });
    }

    if (notification.userId !== payload.userId) {
      return NextResponse.json({ message: 'Хандах эрхгүй' }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { message: 'Мэдэгдэл шинэчлэхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ message: 'Буруу токен' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ message: 'Мэдэгдэл олдсонгүй' }, { status: 404 });
    }

    if (notification.userId !== payload.userId) {
      return NextResponse.json({ message: 'Хандах эрхгүй' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Мэдэгдэл устгагдлаа',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { message: 'Мэдэгдэл устгахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
