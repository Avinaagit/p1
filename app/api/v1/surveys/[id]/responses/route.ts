import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../../../_lib/auth';
import { getUserContext, createAuditLog } from '../../../../../_lib/dal';
import { handleError, successResponse } from '../../../_middleware';
import prisma from '../../../../../_lib/db';
import { analyzeSentimentRealtime, extractKeywords, analyzeEmotions } from '../../../../../_lib/nlp';
import { analyzeSurveyResponses } from '../../../../../_lib/survey-interpretation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/surveys/[id]/responses
 * Submit a survey response
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    const { responses, anonymousId } = await req.json();

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { success: false, error: 'Responses array required' },
        { status: 400 }
      );
    }

    // Generate interpretation for wellbeing surveys
    const interpretation = analyzeSurveyResponses(responses, survey.questions);

    // Combine all responses into one text for sentiment analysis
    const responseText = responses
      .map((r: any) => r.answer)
      .filter(Boolean)
      .join(' ');

    // Real-time sentiment analysis
    const sentimentData = analyzeSentimentRealtime(responseText);
    const keywords = extractKeywords(responseText);
    const emotions = analyzeEmotions(responseText);

    // Create response with sentiment details
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        respondentId: userContext?.userId || null,
        anonymousId: survey.isAnonymous ? anonymousId : null,
        sentimentScore: sentimentData.score,
        questionResponses: {
          create: responses.map((r: any) => ({
            questionId: r.questionId,
            answer: JSON.stringify(r.answer),
          })),
        },
        sentiment: {
          create: {
            rawText: responseText,
            sentimentScore: sentimentData.score,
            sentimentLabel: sentimentData.label,
            confidence: sentimentData.confidence,
            emotionAnalysis: JSON.stringify(emotions),
            keywordsDetected: JSON.stringify(keywords),
          },
        },
      },
      include: {
        questionResponses: { include: { question: true } },
        sentiment: true,
      },
    });

    if (userContext) {
      await createAuditLog(
        userContext,
        'SUBMIT_SURVEY_RESPONSE',
        'SurveyResponse',
        response.id,
        `Submitted response to survey: ${survey.id}`,
        req
      );
    }

    return successResponse({ ...response, interpretation }, 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/surveys/[id]/responses
 * Get responses for a survey (admin/consultant only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const survey = await prisma.survey.findUnique({
      where: { id },
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

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
      include: {
        respondent: { select: { id: true, email: true, firstName: true, department: true } },
        questionResponses: { include: { question: true } },
        sentiment: true,
        survey: { include: { questions: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (responses.length === 0) {
      return successResponse([]);
    }

    await createAuditLog(
      userContext,
      'LIST_SURVEY_RESPONSES',
      'SurveyResponse',
      id,
      undefined,
      req
    );

    return successResponse(responses);
  } catch (error) {
    return handleError(error);
  }
}
