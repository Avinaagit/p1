import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/_lib/jwt';
import { prisma } from '@/app/_lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ message: 'Буруу токен' }, { status: 401 });
    }

    // Get unique departments from users
    const departments = await prisma.user.findMany({
      where: {
        department: { not: null },
        isActive: true,
      },
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    const departmentList = departments
      .map(d => d.department)
      .filter((d): d is string => d !== null)
      .sort();

    return NextResponse.json({ departments: departmentList }, { status: 200 });

  } catch (error: any) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { message: 'Хэлтэс жагсаалт авахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
