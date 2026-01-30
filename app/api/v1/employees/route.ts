import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR', 'CONSULTANT', 'SYSTEM_ADMIN'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const scope = request.nextUrl.searchParams.get('scope');
    const includeAll = scope === 'all' && ['ADMIN', 'CONSULTANT'].includes(userContext.role);

    // Use type-safe object for whereClause
    let whereClause: { [key: string]: any } = includeAll ? {} : { role: 'EMPLOYEE' };
    if (!includeAll && userContext.role === 'HR' && scope === 'department') {
      if (!userContext.department) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      whereClause = { ...whereClause, department: userContext.department };
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        locationName: true,
        department: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: employees }, { status: 200 });
  } catch (error: any) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { message: 'Ажилтны мэдээлэл авахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR', 'SYSTEM_ADMIN'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const department = String(body?.department || '').trim();
    const companyName = String(body?.companyName || '').trim();
    const locationName = String(body?.locationName || '').trim();
    const requestedRole = String(body?.role || 'EMPLOYEE').trim().toUpperCase();
    const enforcedDepartment =
      userContext.role === 'HR' ? String(userContext.department || '').trim() : department;

    if (userContext.role === 'HR' && !enforcedDepartment) {
      return NextResponse.json(
        { success: false, message: 'Хэлтэс тохируулаагүй байна' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, message: 'Нэр, овог, и-мэйл заавал шаардлагатай' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'И-мэйл буруу байна' },
        { status: 400 }
      );
    }

    const employee = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        companyName: companyName || null,
        locationName: locationName || null,
        department: enforcedDepartment || null,
        role: ['ADMIN', 'SYSTEM_ADMIN'].includes(userContext.role) ? requestedRole : 'EMPLOYEE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        locationName: true,
        department: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error: any) {
    console.error('Create employee error:', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Ижил и-мэйл бүртгэлтэй байна' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Ажилтан бүртгэхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
