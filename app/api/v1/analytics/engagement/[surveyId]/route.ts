import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../../../_lib/auth';
import { getUserContext, createAuditLog } from '../../../../../_lib/dal';
import { handleError, successResponse } from '../../../_middleware';
import prisma from '../../../../../_lib/db';
import { calculateAggregateStats } from '../../../../../_lib/nlp';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/analytics/engagement/[surveyId]
 * Get engagement metrics and analytics for a survey
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and HR can view analytics
    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    if (userContext.role === 'HR' || userContext.role === 'CONSULTANT') {
      if (!userContext.department || (survey.targetDepartment && survey.targetDepartment !== userContext.department)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Get all responses for the survey
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      include: { sentiment: true },
    });

    const totalResponded = responses.length;
    const responseRate = survey.endDate > new Date() ? null : (totalResponded / 1) * 100; // Simplified

    // Calculate sentiment statistics
    const sentimentScores = responses
      .map((r) => r.sentimentScore)
      .filter((s) => s !== null) as number[];

    const sentimentStats = calculateAggregateStats(sentimentScores);

    // Group by sentiment label
    const sentimentBreakdown = responses.reduce(
      (acc, r) => {
        const label = r.sentiment?.sentimentLabel || 'unknown';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate NPS if there are NPS questions
    const npsResponses = responses.filter((r) =>
      r.sentiment?.keywordsDetected ? JSON.parse(r.sentiment.keywordsDetected) : []
    );

    const engagement = await prisma.engagementMetric.upsert({
      where: { surveyId },
      update: {
        totalResponded,
        responseRate: responseRate || 0,
        departmentBreakdown: JSON.stringify({}), // Simplified
        roleBreakdown: JSON.stringify({}), // Simplified
      },
      create: {
        surveyId,
        totalDistributed: 100, // Simplified
        totalResponded,
        responseRate: responseRate || 0,
      },
    });

    const analytics = {
      survey: {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        totalResponses: totalResponded,
      },
      engagement,
      sentiment: {
        average: sentimentStats.average,
        distribution: sentimentBreakdown,
        stats: {
          positive: sentimentStats.positive,
          neutral: sentimentStats.neutral,
          negative: sentimentStats.negative,
          stdDev: sentimentStats.stdDev,
        },
      },
    };

    await createAuditLog(
      userContext,
      'VIEW_ENGAGEMENT_ANALYTICS',
      'EngagementMetric',
      surveyId,
      undefined,
      req
    );

    return successResponse(analytics);
  } catch (error) {
    return handleError(error);
  }
}
