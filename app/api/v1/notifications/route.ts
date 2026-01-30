import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/_lib/jwt';
import { prisma } from '@/app/_lib/prisma';

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ message: 'Буруу токен' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause = {
      userId: payload.userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        survey: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: payload.userId,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { message: 'Мэдэгдэл авахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'CONSULTANT' && payload.role !== 'HR')) {
      return NextResponse.json({ message: 'Зөвхөн админ болон зөвлөх мэдэгдэл үүсгэх эрхтэй' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, type, title, message, surveyId, actionUrl } = body;

    if (!userIds || !type || !title || !message) {
      return NextResponse.json({ message: 'Шаардлагатай мэдээлэл дутуу байна' }, { status: 400 });
    }

    // Create notifications for multiple users
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId: string) => ({
        userId,
        type,
        title,
        message,
        surveyId: surveyId || null,
        actionUrl: actionUrl || null,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `${notifications.count} мэдэгдэл үүслээ`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { message: 'Мэдэгдэл үүсгэхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
