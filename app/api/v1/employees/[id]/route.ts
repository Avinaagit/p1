import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, department: true },
    });

    if (!existing || existing.role !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Ажилтан олдсонгүй' }, { status: 404 });
    }

    if (userContext.role === 'HR') {
      if (!userContext.department) {
        return NextResponse.json({ success: false, message: 'Хэлтэс тохируулаагүй байна' }, { status: 400 });
      }
      if (existing.department && existing.department !== userContext.department) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const department = String(body?.department || '').trim();
    const companyName = String(body?.companyName || '').trim();
    const locationName = String(body?.locationName || '').trim();
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : undefined;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, message: 'Нэр, овог, и-мэйл заавал шаардлагатай' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json({ success: false, message: 'И-мэйл буруу байна' }, { status: 400 });
    }

    const enforcedDepartment =
      userContext.role === 'HR' ? String(userContext.department || '').trim() : department;

    if (userContext.role === 'HR' && !enforcedDepartment) {
      return NextResponse.json(
        { success: false, message: 'Хэлтэс тохируулаагүй байна' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        companyName: companyName || null,
        locationName: locationName || null,
        department: enforcedDepartment || null,
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
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

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Update employee error:', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Ижил и-мэйл бүртгэлтэй байна' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Ажилтны мэдээлэл засахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
