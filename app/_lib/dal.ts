import prisma from './db';
import { JWTPayload, verifyToken } from './auth';
import { validateUserContext, canAccessResource } from './rbac';

/**
 * Data Access Layer (DAL) for user-role-based data access
 * All database operations should go through this layer for security
 */

export interface UserContext {
  userId: string;
  email: string;
  role: string;
  department?: string;
}

/**
 * Get authenticated user context from token
 */
export async function getUserContext(token: string | null): Promise<UserContext | null> {
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return validateUserContext(payload) as UserContext | null;
}

/**
 * Verify user has permission before accessing resource
 */
export async function authorizeUser(
  userContext: UserContext | null,
  requiredRole?: string[]
): Promise<boolean> {
  if (!userContext) return false;

  if (requiredRole && !requiredRole.includes(userContext.role)) {
    return false;
  }

  return true;
}

/**
 * Get surveys visible to the user based on role and department
 */
export async function getSurveysForUser(userContext: UserContext) {
  if (userContext.role === 'ADMIN') {
    // Admin sees all surveys
    return prisma.survey.findMany({
      include: {
        creator: { select: { id: true, email: true, firstName: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (userContext.role === 'CONSULTANT') {
    // Consultant sees all surveys (can view and manage)
    return prisma.survey.findMany({
      include: {
        creator: { select: { id: true, email: true, firstName: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (userContext.role === 'EMPLOYEE') {
    // Employee only sees published/active surveys
    return prisma.survey.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        creator: { select: { id: true, firstName: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  return [];
}

/**
 * Get survey responses visible to user
 */
export async function getSurveyResponsesForUser(userContext: UserContext, surveyId: string) {
  // Verify user can access this survey first
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) return null;

  if (userContext.role === 'EMPLOYEE') {
    // Employee can only see their own responses
    return prisma.surveyResponse.findMany({
      where: {
        surveyId,
        respondentId: userContext.userId,
      },
      include: {
        questionResponses: {
          include: { question: true },
        },
        sentiment: true,
      },
    });
  }

  if (userContext.role === 'CONSULTANT') {
    // Consultant sees all responses for their department surveys
    return prisma.surveyResponse.findMany({
      where: { surveyId },
      include: {
        respondent: { select: { id: true, email: true, firstName: true, department: true } },
        questionResponses: { include: { question: true } },
        sentiment: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // Admin sees all responses
  return prisma.surveyResponse.findMany({
    where: { surveyId },
    include: {
      respondent: { select: { id: true, email: true, firstName: true, department: true } },
      questionResponses: { include: { question: true } },
      sentiment: true,
    },
    orderBy: { submittedAt: 'desc' },
  });
}

/**
 * Create audit log for tracking user actions
 */
export async function createAuditLog(
  userContext: UserContext,
  action: string,
  resourceType: string,
  resourceId?: string,
  description?: string,
  req?: Request
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userContext.userId,
        action,
        resourceType,
        resourceId,
        description,
        ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || undefined,
        userAgent: req?.headers.get('user-agent') || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the operation
  }
}

/**
 * Get tasks for user based on role
 */
export async function getTasksForUser(userContext: UserContext) {
  if (userContext.role === 'ADMIN') {
    return prisma.task.findMany({
      include: { assignee: { select: { id: true, email: true, firstName: true } } },
      orderBy: { deadline: 'asc' },
    });
  }

  // Consultant and Employee see only their assigned tasks
  return prisma.task.findMany({
    where: { assignedTo: userContext.userId },
    include: { assignee: { select: { id: true, email: true, firstName: true } } },
    orderBy: { deadline: 'asc' },
  });
}

/**
 * Get engagement metrics visible to user
 */
export async function getEngagementMetricsForUser(userContext: UserContext) {
  if (userContext.role === 'ADMIN') {
    return prisma.engagementMetric.findMany({
      include: { survey: true },
      orderBy: { lastCalculatedAt: 'desc' },
    });
  }

  if (userContext.role === 'CONSULTANT') {
    return prisma.engagementMetric.findMany({
      include: { survey: { select: { id: true, title: true, targetDepartment: true } } },
      orderBy: { lastCalculatedAt: 'desc' },
    });
  }

  // Employees don't see engagement metrics
  return [];
}
