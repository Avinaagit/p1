import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../../_lib/auth';
import { getUserContext, getSurveyResponsesForUser, createAuditLog } from '../../../../_lib/dal';
import { handleError, successResponse } from '../../_middleware';
import prisma from '../../../../_lib/db';
import { analyzeSentimentRealtime, extractKeywords } from '../../../../_lib/nlp';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/surveys/[id]
 * Get survey details
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
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
      include: {
        questions: true,
        creator: { select: { id: true, email: true, firstName: true } },
        _count: { select: { responses: true } },
      },
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

    await createAuditLog(
      userContext,
      'VIEW_SURVEY',
      'Survey',
      survey.id,
      undefined,
      req
    );

    return successResponse(survey);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/v1/surveys/[id]
 * Update survey
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and survey creator/CONSULTANT can edit
    const survey = await prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    if (
      userContext.role !== 'ADMIN' &&
      survey.createdBy !== userContext.userId &&
      userContext.role !== 'CONSULTANT' &&
      userContext.role !== 'HR'
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { title, description, startDate, endDate, status, targetRoles } = await req.json();

    const updated = await prisma.survey.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(targetRoles && { targetRoles: JSON.stringify(targetRoles) }),
      },
      include: {
        questions: true,
        creator: { select: { id: true, email: true, firstName: true } },
      },
    });

    await createAuditLog(
      userContext,
      'UPDATE_SURVEY',
      'Survey',
      survey.id,
      `Updated survey: ${title}`,
      req
    );

    return successResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/surveys/[id]
 * Delete survey
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = extractToken(req);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN and survey creator can delete
    const survey = await prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    if (userContext.role !== 'ADMIN' && survey.createdBy !== userContext.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.survey.delete({
      where: { id },
    });

    await createAuditLog(
      userContext,
      'DELETE_SURVEY',
      'Survey',
      survey.id,
      `Deleted survey: ${survey.title}`,
      req
    );

    return successResponse({ message: 'Survey deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
