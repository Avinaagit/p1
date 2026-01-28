import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/_lib/jwt';
import { sendSurveyReminders, scheduleRecurringSurveys } from '@/app/_lib/notifications';

// This endpoint should be called by a cron job
// Example: Every day at 9:00 AM
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization (or use a secret key for cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check for cron secret or admin token
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Valid cron request
    } else {
      // Check for admin token
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ message: 'Нэвтэрч орохгүй байна' }, { status: 401 });
      }

      const payload = verifyJWT(token);
      if (!payload || payload.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Зөвхөн админ ажиллуулах эрхтэй' }, { status: 403 });
      }
    }

    // Send survey reminders
    const reminderResults = await sendSurveyReminders();

    // Schedule recurring surveys
    const recurringResults = await scheduleRecurringSurveys();

    return NextResponse.json({
      success: true,
      message: 'Cron job амжилттай ажиллалаа',
      results: {
        reminders: reminderResults,
        recurring: recurringResults,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { message: 'Алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
