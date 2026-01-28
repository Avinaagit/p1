import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../_lib/auth';
import { getUserContext, createAuditLog } from '../../../_lib/dal';
import { handleError, successResponse } from '../_middleware';
import prisma from '../../../_lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/exports/surveys
 * Export survey data in BI-friendly format (denormalized)
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and HR can export
    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const format = new URL(req.url).searchParams.get('format') || 'json';

    // Get all surveys with responses in denormalized format
    const surveys = await prisma.survey.findMany({
      include: {
        responses: {
          include: {
            sentiment: true,
            questionResponses: true,
            respondent: { select: { id: true, email: true, department: true, role: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });

    // Denormalize for BI consumption
    const denormalized = surveys.flatMap((survey) =>
      survey.responses.map((response) => ({
        surveyId: survey.id,
        surveyTitle: survey.title,
        surveyCreatedAt: survey.createdAt.toISOString(),
        surveyStatus: survey.status,
        responseId: response.id,
        respondentId: response.respondentId,
        respondentEmail: response.respondent?.email,
        respondentDepartment: response.respondent?.department,
        respondentRole: response.respondent?.role,
        responseSubmittedAt: response.submittedAt.toISOString(),
        sentimentScore: response.sentimentScore,
        sentimentLabel: response.sentiment?.sentimentLabel,
        sentimentConfidence: response.sentiment?.confidence,
      }))
    );

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(denormalized);
      const response = new NextResponse(csv);
      response.headers.set('Content-Type', 'text/csv');
      response.headers.set('Content-Disposition', 'attachment; filename="surveys-export.csv"');
      return response;
    }

    await createAuditLog(
      userContext,
      'EXPORT_SURVEYS',
      'Survey',
      undefined,
      `Exported ${surveys.length} surveys in ${format} format`,
      req
    );

    return successResponse(denormalized);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/exports/sentiment
 * Export sentiment analysis data
 */
export async function GET_SENTIMENT(req: NextRequest) {
  try {
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const sentiments = await prisma.sentimentAnalysis.findMany({
      include: {
        survey: { select: { id: true, title: true, status: true } },
      },
    });

    const denormalized = sentiments.map((s) => ({
      surveyId: s.survey.id,
      surveyTitle: s.survey.title,
      surveyStatus: s.survey.status,
      averageSentiment: s.averageSentiment,
      positiveCount: s.positiveCount,
      neutralCount: s.neutralCount,
      negativeCount: s.negativeCount,
      topicsExtracted: s.topicsExtracted ? JSON.parse(s.topicsExtracted) : [],
      analyzedAt: s.analyzedAt.toISOString(),
    }));

    await createAuditLog(
      userContext,
      'EXPORT_SENTIMENT_DATA',
      'SentimentAnalysis',
      undefined,
      `Exported sentiment data for ${sentiments.length} surveys`,
      req
    );

    return successResponse(denormalized);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/exports/engagement
 * Export engagement metrics
 */
export async function GET_ENGAGEMENT(req: NextRequest) {
  try {
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const metrics = await prisma.engagementMetric.findMany({
      include: {
        survey: { select: { id: true, title: true, status: true, createdAt: true } },
      },
    });

    const denormalized = metrics.map((m) => ({
      surveyId: m.survey.id,
      surveyTitle: m.survey.title,
      surveyStatus: m.survey.status,
      surveyCreatedAt: m.survey.createdAt.toISOString(),
      totalDistributed: m.totalDistributed,
      totalResponded: m.totalResponded,
      responseRate: m.responseRate,
      averageRating: m.averageRating,
      npsScore: m.npsScore,
      lastCalculatedAt: m.lastCalculatedAt.toISOString(),
    }));

    await createAuditLog(
      userContext,
      'EXPORT_ENGAGEMENT_METRICS',
      'EngagementMetric',
      undefined,
      `Exported engagement metrics for ${metrics.length} surveys`,
      req
    );

    return successResponse(denormalized);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Helper: Convert array of objects to CSV
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    ),
  ].join('\n');

  return csv;
}
