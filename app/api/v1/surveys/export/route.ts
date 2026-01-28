import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext, createAuditLog } from '@/app/_lib/dal';
import { prisma } from '@/app/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const format = new URL(request.url).searchParams.get('format') || 'csv';

    const surveys = await prisma.survey.findMany({
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const denormalized = surveys.map((survey) => ({
      title: survey.title,
      description: survey.description || '',
      status: survey.status,
      startDate: survey.startDate.toISOString(),
      endDate: survey.endDate.toISOString(),
      createdAt: survey.createdAt.toISOString(),
      responseCount: survey._count.responses,
    }));

    await createAuditLog(
      userContext,
      'EXPORT_SURVEYS_LIST',
      'Survey',
      undefined,
      `Exported ${surveys.length} surveys in ${format} format`,
      request
    );

    if (format === 'json') {
      return NextResponse.json({ success: true, data: denormalized }, { status: 200 });
    }

    const csv = convertToCSV(denormalized);
    const response = new NextResponse(csv);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename="surveys-export.csv"');
    return response;
  } catch (error: any) {
    console.error('Export surveys error:', error);
    return NextResponse.json(
      { message: 'Судалгааны жагсаалт татахад алдаа гарлаа', error: error.message },
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
