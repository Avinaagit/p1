import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../_lib/auth';
import { getUserContext, getSurveysForUser, createAuditLog } from '../../../_lib/dal';
import { handleError, successResponse, paginatedResponse } from '../_middleware';
import prisma from '../../../_lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/surveys
 * Get surveys visible to the current user
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

    // Get pagination params
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(50, parseInt(url.searchParams.get('pageSize') || '10'));
    const skip = (page - 1) * pageSize;

    const surveys = await getSurveysForUser(userContext);

    // Apply pagination
    const paginatedSurveys = surveys.slice(skip, skip + pageSize);

    await createAuditLog(userContext, 'LIST_SURVEYS', 'Survey', undefined, undefined, req);

    return paginatedResponse(paginatedSurveys, surveys.length, page, pageSize);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/surveys
 * Create a new survey
 */
export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and CONSULTANT can create surveys
    if (!['ADMIN', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      startDate,
      endDate,
      targetDepartment,
      targetRoles,
      isAnonymous,
      questions,
    } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Title, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Create survey with questions
    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        createdBy: userContext.userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetDepartment,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        isAnonymous,
        questions: {
          create: (questions || []).map((q: any, index: number) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? JSON.stringify(q.options) : null,
            isRequired: q.isRequired ?? true,
            displayOrder: index,
          })),
        },
      },
      include: {
        questions: true,
        creator: { select: { id: true, email: true, firstName: true } },
      },
    });

    await createAuditLog(
      userContext,
      'CREATE_SURVEY',
      'Survey',
      survey.id,
      `Created survey: ${title}`,
      req
    );

    return successResponse(survey, 201);
  } catch (error) {
    return handleError(error);
  }
}
