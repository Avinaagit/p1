import { NextRequest, NextResponse } from 'next/server';
import { extractToken } from '../../../../_lib/auth';
import { getUserContext, createAuditLog } from '../../../../_lib/dal';
import { handleError, successResponse } from '../../_middleware';
import prisma from '../../../../_lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/tasks/[id]
 * Get task details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      userContext.role !== 'ADMIN' &&
      task.assignedTo !== userContext.userId
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await createAuditLog(
      userContext,
      'VIEW_TASK',
      'Task',
      task.id,
      undefined,
      req
    );

    return successResponse(task);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/v1/tasks/[id]
 * Update task status or details
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      userContext.role !== 'ADMIN' &&
      task.assignedTo !== userContext.userId
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { status, priority, completedAt } = await req.json();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: {
        assignee: { select: { id: true, email: true, firstName: true } },
      },
    });

    await createAuditLog(
      userContext,
      'UPDATE_TASK',
      'Task',
      task.id,
      `Updated task status to: ${status}`,
      req
    );

    return successResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
