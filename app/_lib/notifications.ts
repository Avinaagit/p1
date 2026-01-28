import { prisma } from '@/app/_lib/prisma';
import { sendEmail, generateSurveyInvitationEmail } from '@/app/_lib/email';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  surveyId?: string;
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      surveyId: params.surveyId || null,
      actionUrl: params.actionUrl || null,
    },
  });
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  return await prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      surveyId: params.surveyId || null,
      actionUrl: params.actionUrl || null,
    })),
  });
}

// Send survey reminder notifications
export async function sendSurveyReminders() {
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Find surveys ending in 3 days
  const upcomingSurveys = await prisma.survey.findMany({
    where: {
      status: 'PUBLISHED',
      endDate: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    include: {
      responses: {
        select: {
          respondentId: true,
        },
      },
    },
  });

  const results = {
    total: 0,
    sent: 0,
    failed: 0,
  };

  for (const survey of upcomingSurveys) {
    // Get all active users
    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Filter users who haven't responded yet
    const respondedUserIds = new Set(
      survey.responses.map(r => r.respondentId).filter((id): id is string => id !== null)
    );
    
    const usersToRemind = allUsers.filter(user => !respondedUserIds.has(user.id));

    results.total += usersToRemind.length;

    // Create notifications
    await createBulkNotifications(
      usersToRemind.map(u => u.id),
      {
        type: 'SURVEY_REMINDER',
        title: '📊 Судалгаа бөглөх санамж',
        message: `"${survey.title}" судалгаа ${new Date(survey.endDate).toLocaleDateString('mn-MN')} дуусна. Та бөглөөгүй байна.`,
        surveyId: survey.id,
        actionUrl: `/surveys/${survey.id}`,
      }
    );

    // Send email reminders
    for (const user of usersToRemind) {
      try {
        const html = generateSurveyInvitationEmail(
          `${user.firstName} ${user.lastName}`,
          survey.title,
          survey.id,
          `⏰ Санамж: Судалгаа ${new Date(survey.endDate).toLocaleDateString('mn-MN')} дуусна`
        );

        await sendEmail({
          to: user.email,
          subject: `⏰ Судалгааны санамж: ${survey.title}`,
          html,
        });

        results.sent++;
      } catch (err) {
        console.error(`Failed to send reminder to ${user.email}:`, err);
        results.failed++;
      }
    }
  }

  return results;
}

// Check for recurring surveys and schedule next occurrence
export async function scheduleRecurringSurveys() {
  const now = new Date();

  const recurringSurveys = await prisma.survey.findMany({
    where: {
      isRecurring: true,
      nextScheduledDate: {
        lte: now,
      },
    },
  });

  for (const survey of recurringSurveys) {
    // Calculate next scheduled date based on frequency
    let nextDate = new Date(survey.endDate);
    
    switch (survey.frequency) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    // Update survey with new scheduled date
    await prisma.survey.update({
      where: { id: survey.id },
      data: {
        nextScheduledDate: nextDate,
      },
    });

    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    // Create notifications for new cycle
    await createBulkNotifications(
      users.map(u => u.id),
      {
        type: 'SURVEY_INVITATION',
        title: '📧 Шинэ судалгааны урилга',
        message: `"${survey.title}" судалгаа дахин эхэллээ. Та оролцоно уу.`,
        surveyId: survey.id,
        actionUrl: `/surveys/${survey.id}`,
      }
    );
  }

  return {
    processed: recurringSurveys.length,
  };
}
