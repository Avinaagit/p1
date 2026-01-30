import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { sendBulkSurveyInvitations } from '@/app/_lib/email';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
    }

    if (!['ADMIN', 'CONSULTANT', 'HR'].includes(userContext.role)) {
      return NextResponse.json({ message: 'Зөвхөн админ болон зөвлөх илгээх эрхтэй' }, { status: 403 });
    }

    const body = await request.json();
    const { surveyId, targetDepartment, targetRoles, recipientEmails } = body;

    if (!surveyId) {
      return NextResponse.json({ message: 'Судалгааны ID заавал шаардлагатай' }, { status: 400 });
    }

    // Get survey details
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        targetDepartment: true,
      },
    });

    if (!survey) {
      return NextResponse.json({ message: 'Судалгаа олдсонгүй' }, { status: 404 });
    }

    const now = new Date();
    const isActive =
      survey.status === 'PUBLISHED' && survey.startDate <= now && survey.endDate >= now;

    if (!isActive) {
      return NextResponse.json(
        { message: 'Зөвхөн идэвхтэй судалгаанд урилга илгээх боломжтой' },
        { status: 400 }
      );
    }

    if (userContext.role === 'HR' || userContext.role === 'CONSULTANT') {
      if (!userContext.department || (survey.targetDepartment && survey.targetDepartment !== userContext.department)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    // Build query to get recipients
    let whereClause: Record<string, any> = {
      isActive: true,
      email: { not: null },
      role: 'EMPLOYEE',
    };

    // Filter by specific emails if provided
    if (recipientEmails && recipientEmails.length > 0) {
      whereClause.email = { in: recipientEmails };
      if (userContext.role === 'HR' || userContext.role === 'CONSULTANT') {
        whereClause.department = userContext.department;
      }
    } else {
      // Filter by department if specified
      if (targetDepartment && targetDepartment !== 'ALL') {
        whereClause.department = targetDepartment;
      }

      // Filter by roles if specified
      if (targetRoles && targetRoles.length > 0 && !targetRoles.includes('ALL')) {
        whereClause.role = { in: targetRoles };
      }

      if (userContext.role === 'HR' || userContext.role === 'CONSULTANT') {
        whereClause.department = userContext.department;
      }
    }

    // Get recipients
    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'Хүлээн авагч олдсонгүй' }, { status: 400 });
    }

    // Send emails
    const results = await sendBulkSurveyInvitations(
      recipients,
      survey.title,
      survey.id,
      survey.description || undefined
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: userContext.userId,
        action: 'SEND_SURVEY_INVITATIONS',
        resourceType: 'Survey',
        resourceId: surveyId,
        description: `Судалгааны урилга илгээсэн: ${results.success}/${results.total}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'И-мэйл илгээх үйлдэл дууслаа',
      results,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Survey invitation error:', error);
    return NextResponse.json(
      { message: 'И-мэйл илгээхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
