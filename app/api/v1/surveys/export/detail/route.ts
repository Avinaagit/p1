import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const surveyId = new URL(request.url).searchParams.get('surveyId');
    if (!surveyId) {
      return NextResponse.json({ success: false, message: 'surveyId шаардлагатай' }, { status: 400 });
    }

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        questions: true,
        responses: {
          include: {
            respondent: { select: { id: true, email: true, firstName: true, lastName: true, department: true, role: true } },
            questionResponses: { include: { question: true } },
            sentiment: true,
          },
        },
        engagement: true,
        sentimentAnalysis: true,
      },
    });

    if (!survey) {
      return NextResponse.json({ success: false, message: 'Survey олдсонгүй' }, { status: 404 });
    }

    const surveySheet = [
      {
        id: survey.id,
        title: survey.title,
        description: survey.description || '',
        createdBy: survey.createdBy,
        creatorEmail: survey.creator?.email || '',
        creatorFirstName: survey.creator?.firstName || '',
        creatorLastName: survey.creator?.lastName || '',
        status: survey.status,
        startDate: survey.startDate?.toISOString?.() || '',
        endDate: survey.endDate?.toISOString?.() || '',
        targetDepartment: survey.targetDepartment || '',
        targetRoles: survey.targetRoles || '',
        isAnonymous: survey.isAnonymous,
        isRecurring: survey.isRecurring,
        frequency: survey.frequency || '',
        nextScheduledDate: survey.nextScheduledDate?.toISOString?.() || '',
        reminderDays: survey.reminderDays,
        createdAt: survey.createdAt?.toISOString?.() || '',
        updatedAt: survey.updatedAt?.toISOString?.() || '',
      },
    ];

    const questionsSheet = survey.questions.map((q) => ({
      id: q.id,
      surveyId: q.surveyId,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options || '',
      isRequired: q.isRequired,
      displayOrder: q.displayOrder,
      createdAt: q.createdAt?.toISOString?.() || '',
    }));

    const responsesSheet = survey.responses.map((r) => ({
      id: r.id,
      surveyId: r.surveyId,
      respondentId: r.respondentId || '',
      respondentEmail: r.respondent?.email || '',
      respondentFirstName: r.respondent?.firstName || '',
      respondentLastName: r.respondent?.lastName || '',
      respondentDepartment: r.respondent?.department || '',
      respondentRole: r.respondent?.role || '',
      anonymousId: r.anonymousId || '',
      sentimentScore: r.sentimentScore ?? '',
      submittedAt: r.submittedAt?.toISOString?.() || '',
      updatedAt: r.updatedAt?.toISOString?.() || '',
    }));

    const questionResponsesSheet = survey.responses.flatMap((r) =>
      r.questionResponses.map((qr) => ({
        id: qr.id,
        responseId: qr.responseId,
        surveyId: r.surveyId,
        questionId: qr.questionId,
        questionText: qr.question?.questionText || '',
        questionType: qr.question?.questionType || '',
        answer: qr.answer,
        createdAt: qr.createdAt?.toISOString?.() || '',
        respondentEmail: r.respondent?.email || '',
      }))
    );

    const sentimentSheet = survey.responses
      .filter((r) => r.sentiment)
      .map((r) => ({
        responseId: r.id,
        surveyId: r.surveyId,
        respondentEmail: r.respondent?.email || '',
        rawText: r.sentiment?.rawText || '',
        sentimentScore: r.sentiment?.sentimentScore ?? '',
        sentimentLabel: r.sentiment?.sentimentLabel || '',
        confidence: r.sentiment?.confidence ?? '',
        emotionAnalysis: r.sentiment?.emotionAnalysis || '',
        keywordsDetected: r.sentiment?.keywordsDetected || '',
        analyzedAt: r.sentiment?.analyzedAt?.toISOString?.() || '',
      }));

    const engagementSheet = survey.engagement
      ? [
          {
            surveyId: survey.engagement.surveyId,
            totalDistributed: survey.engagement.totalDistributed,
            totalResponded: survey.engagement.totalResponded,
            responseRate: survey.engagement.responseRate,
            averageRating: survey.engagement.averageRating ?? '',
            npsScore: survey.engagement.npsScore ?? '',
            departmentBreakdown: survey.engagement.departmentBreakdown || '',
            roleBreakdown: survey.engagement.roleBreakdown || '',
            lastCalculatedAt: survey.engagement.lastCalculatedAt?.toISOString?.() || '',
            updatedAt: survey.engagement.updatedAt?.toISOString?.() || '',
          },
        ]
      : [];

    const sentimentAnalysisSheet = survey.sentimentAnalysis
      ? [
          {
            surveyId: survey.sentimentAnalysis.surveyId,
            averageSentiment: survey.sentimentAnalysis.averageSentiment,
            positiveCount: survey.sentimentAnalysis.positiveCount,
            neutralCount: survey.sentimentAnalysis.neutralCount,
            negativeCount: survey.sentimentAnalysis.negativeCount,
            topicsExtracted: survey.sentimentAnalysis.topicsExtracted || '',
            keywordFrequency: survey.sentimentAnalysis.keywordFrequency || '',
            analyzedAt: survey.sentimentAnalysis.analyzedAt?.toISOString?.() || '',
            updatedAt: survey.sentimentAnalysis.updatedAt?.toISOString?.() || '',
          },
        ]
      : [];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(surveySheet), 'Survey');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(questionsSheet), 'Questions');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(responsesSheet), 'Responses');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(questionResponsesSheet), 'QuestionResponses');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sentimentSheet), 'Sentiment');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(engagementSheet), 'Engagement');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sentimentAnalysisSheet), 'SentimentAnalysis');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const response = new NextResponse(buffer as any);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', `attachment; filename="survey-${surveyId}.xlsx"`);
    return response;
  } catch (error: any) {
    console.error('Survey export detail error:', error);
    return NextResponse.json(
      { success: false, message: 'Export хийхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
