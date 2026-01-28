import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext, createAuditLog } from '@/app/_lib/dal';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const format = new URL(request.url).searchParams.get('format') || 'csv';

    const whereClause: { role: string; department?: string | null } = { role: 'EMPLOYEE' };

    if (userContext.role === 'HR') {
      if (!userContext.department) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      whereClause.department = userContext.department;
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        locationName: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const companyName = process.env.COMPANY_NAME || '';
    const locationName = process.env.LOCATION_NAME || '';

    const denormalized = employees.map((employee) => ({
      Company: employee.companyName || companyName,
      'Газрын нэр': employee.locationName || locationName,
      'Хэлтэс': employee.department || '',
      'Нэр': employee.firstName,
      'Овог': employee.lastName,
      'И-мэйл': employee.email,
      'Идэвх': employee.isActive ? 'Идэвхтэй' : 'Идэвхгүй',
      'Бүртгэсэн огноо': employee.createdAt.toISOString(),
    }));

    await createAuditLog(
      userContext,
      'EXPORT_EMPLOYEES',
      'User',
      undefined,
      `Exported ${employees.length} employees in ${format} format`,
      request
    );

    if (format === 'json') {
      return NextResponse.json({ success: true, data: denormalized }, { status: 200 });
    }

    const csv = convertToCSV(denormalized);
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename="employees-export.csv"');
    return response;
  } catch (error: any) {
    console.error('Export employees error:', error);
    return NextResponse.json(
      { message: 'Ажилтны бүртгэл татахад алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvBody = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    ),
  ].join('\n');

  return `\ufeff${csvBody}`;
}
