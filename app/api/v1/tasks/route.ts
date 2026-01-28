import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../_lib/auth';
import { getUserContext, getTasksForUser, createAuditLog } from '../../../_lib/dal';
import { handleError, successResponse } from '../_middleware';
import prisma from '../../../_lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/tasks
 * Get tasks for the current user
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

    const tasks = await getTasksForUser(userContext);

    await createAuditLog(
      userContext,
      'LIST_TASKS',
      'Task',
      undefined,
      undefined,
      req
    );

    return successResponse(tasks);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/tasks
 * Create a new task
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

    // Only ADMIN and HR can create tasks
    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { title, description, assignedTo, deadline, priority, surveyId } = await req.json();

    if (!title || !assignedTo || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Title, assignedTo, and deadline required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedTo,
        deadline: new Date(deadline),
        priority: priority || 'MEDIUM',
        surveyId: surveyId || null,
      },
      include: {
        assignee: { select: { id: true, email: true, firstName: true } },
      },
    });

    await createAuditLog(
      userContext,
      'CREATE_TASK',
      'Task',
      task.id,
      `Created task: ${title}`,
      req
    );

    return successResponse(task, 201);
  } catch (error) {
    return handleError(error);
  }
}
