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

    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids') || '';
    const surveyIds = idsParam.split(',').map((id) => id.trim()).filter(Boolean);

    if (surveyIds.length === 0) {
      return NextResponse.json({ success: true, data: {} }, { status: 200 });
    }

    const responses = await prisma.surveyResponse.findMany({
      where: {
        surveyId: { in: surveyIds },
        respondentId: userContext.userId,
      },
      select: {
        surveyId: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Group by surveyId
    const stats: Record<string, { count: number; lastSubmittedAt?: string }> = {};
    for (const resp of responses) {
      if (!stats[resp.surveyId]) {
        stats[resp.surveyId] = { count: 0, lastSubmittedAt: undefined };
      }
      stats[resp.surveyId].count++;
      if (!stats[resp.surveyId].lastSubmittedAt) {
        stats[resp.surveyId].lastSubmittedAt = resp.submittedAt?.toISOString();
      }
    }

    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error: any) {
    console.error('Response stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Response stats error', error: error.message },
      { status: 500 }
    );
  }
}
