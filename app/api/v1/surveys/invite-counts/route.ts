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

    if (!['ADMIN', 'CONSULTANT', 'HR'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids') || '';
    const surveyIds = idsParam.split(',').map((id) => id.trim()).filter(Boolean);

    if (surveyIds.length === 0) {
      return NextResponse.json({ success: true, data: {} }, { status: 200 });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'SEND_SURVEY_INVITATIONS',
        resourceId: { in: surveyIds },
      },
      select: {
        resourceId: true,
        description: true,
      },
    });

    const counts: Record<string, number> = {};

    for (const log of logs) {
      const resourceId = log.resourceId || '';
      if (!resourceId) continue;

      const desc = log.description || '';
      const fractionMatch = desc.match(/(\d+)\s*\/\s*(\d+)/);
      const numberMatch = desc.match(/(\d+)/);
      let value = 0;

      if (fractionMatch) {
        const success = Number(fractionMatch[1]);
        const total = Number(fractionMatch[2]);
        value = total || success;
      } else if (numberMatch) {
        value = Number(numberMatch[1]);
      }

      counts[resourceId] = (counts[resourceId] || 0) + (Number.isNaN(value) ? 0 : value);
    }

    return NextResponse.json({ success: true, data: counts }, { status: 200 });
  } catch (error: any) {
    console.error('Invite counts error:', error);
    return NextResponse.json(
      { success: false, message: 'Invite counts error', error: error.message },
      { status: 500 }
    );
  }
}
