import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { extractToken } from '@/app/_lib/auth';
import { getUserContext } from '@/app/_lib/dal';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const utcDays = value - 25569;
    const utcValue = utcDays * 86400 * 1000;
    const date = new Date(utcValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    const userContext = await getUserContext(token);

    if (!userContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'HR', 'CONSULTANT'].includes(userContext.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Файл сонгоно уу' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer' });

    const surveySheet = XLSX.utils.sheet_to_json(workbook.Sheets['Survey'], { defval: '' }) as any[];
    const questionsSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Questions'], { defval: '' }) as any[];
    const responsesSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Responses'], { defval: '' }) as any[];
    const questionResponsesSheet = XLSX.utils.sheet_to_json(workbook.Sheets['QuestionResponses'], { defval: '' }) as any[];
    const sentimentSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Sentiment'], { defval: '' }) as any[];
    const engagementSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Engagement'], { defval: '' }) as any[];
    const sentimentAnalysisSheet = XLSX.utils.sheet_to_json(workbook.Sheets['SentimentAnalysis'], { defval: '' }) as any[];

    if (!surveySheet || surveySheet.length === 0) {
      return NextResponse.json({ success: false, message: 'Survey sheet хоосон байна' }, { status: 400 });
    }

    const surveyRow = surveySheet[0];
    const surveyId = String(surveyRow.id || '').trim() || undefined;

    const surveyData = {
      title: String(surveyRow.title || '').trim(),
      description: String(surveyRow.description || '').trim() || null,
      createdBy: String(surveyRow.createdBy || userContext.userId),
      status: String(surveyRow.status || 'PUBLISHED'),
      startDate: parseDate(surveyRow.startDate) || new Date(),
      endDate: parseDate(surveyRow.endDate) || new Date(),
      targetDepartment: String(surveyRow.targetDepartment || '').trim() || null,
      targetRoles: String(surveyRow.targetRoles || '').trim() || null,
      isAnonymous: parseBoolean(surveyRow.isAnonymous),
      isRecurring: parseBoolean(surveyRow.isRecurring),
      frequency: String(surveyRow.frequency || '').trim() || null,
      nextScheduledDate: parseDate(surveyRow.nextScheduledDate),
      reminderDays: Number(surveyRow.reminderDays || 3),
    };

    if (!surveyData.title) {
      return NextResponse.json({ success: false, message: 'Survey title шаардлагатай' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (surveyId) {
        const existing = await tx.survey.findUnique({ where: { id: surveyId } });
        if (existing) {
          await tx.questionResponse.deleteMany({ where: { response: { surveyId } } });
          await tx.sentimentDetail.deleteMany({ where: { response: { surveyId } } });
          await tx.surveyResponse.deleteMany({ where: { surveyId } });
          await tx.surveyQuestion.deleteMany({ where: { surveyId } });
          await tx.engagementMetric.deleteMany({ where: { surveyId } });
          await tx.sentimentAnalysis.deleteMany({ where: { surveyId } });
        }
      }

      const surveyRecord = await tx.survey.upsert({
        where: { id: surveyId || 'new' },
        update: surveyData,
        create: {
          ...(surveyId ? { id: surveyId } : {}),
          ...surveyData,
          createdBy: surveyData.createdBy,
        },
      });

      const surveyKey = surveyRecord.id;

      if (questionsSheet.length > 0) {
        await tx.surveyQuestion.createMany({
          data: questionsSheet.map((q) => ({
            id: q.id ? String(q.id) : undefined,
            surveyId: surveyKey,
            questionText: String(q.questionText || ''),
            questionType: String(q.questionType || 'RATING'),
            options: q.options ? String(q.options) : null,
            isRequired: parseBoolean(q.isRequired),
            displayOrder: Number(q.displayOrder || 0),
            createdAt: parseDate(q.createdAt) || new Date(),
          })),
          skipDuplicates: true,
        });
      }

      const responses = responsesSheet.map((r) => ({
        id: r.id ? String(r.id) : undefined,
        surveyId: surveyKey,
        respondentId: r.respondentId ? String(r.respondentId) : null,
        anonymousId: r.anonymousId ? String(r.anonymousId) : null,
        sentimentScore: r.sentimentScore !== '' ? Number(r.sentimentScore) : null,
        submittedAt: parseDate(r.submittedAt) || new Date(),
        updatedAt: parseDate(r.updatedAt) || new Date(),
      }));

      for (const response of responses) {
        await tx.surveyResponse.create({
          data: {
            ...(response.id ? { id: response.id } : {}),
            surveyId: response.surveyId,
            respondentId: response.respondentId,
            anonymousId: response.anonymousId,
            sentimentScore: response.sentimentScore,
            submittedAt: response.submittedAt,
            updatedAt: response.updatedAt,
          },
        });
      }

      if (questionResponsesSheet.length > 0) {
        await tx.questionResponse.createMany({
          data: questionResponsesSheet.map((qr) => ({
            id: qr.id ? String(qr.id) : undefined,
            responseId: String(qr.responseId),
            questionId: String(qr.questionId),
            answer: String(qr.answer ?? ''),
            createdAt: parseDate(qr.createdAt) || new Date(),
          })),
          skipDuplicates: true,
        });
      }

      if (sentimentSheet.length > 0) {
        await tx.sentimentDetail.createMany({
          data: sentimentSheet.map((s) => ({
            responseId: String(s.responseId),
            rawText: String(s.rawText ?? ''),
            sentimentScore: s.sentimentScore !== '' ? Number(s.sentimentScore) : 0,
            sentimentLabel: String(s.sentimentLabel ?? ''),
            confidence: s.confidence !== '' ? Number(s.confidence) : 0,
            emotionAnalysis: String(s.emotionAnalysis ?? ''),
            keywordsDetected: String(s.keywordsDetected ?? ''),
            analyzedAt: parseDate(s.analyzedAt) || new Date(),
          })),
          skipDuplicates: true,
        });
      }

      if (engagementSheet.length > 0) {
        await tx.engagementMetric.createMany({
          data: engagementSheet.map((e) => ({
            surveyId: surveyKey,
            totalDistributed: Number(e.totalDistributed || 0),
            totalResponded: Number(e.totalResponded || 0),
            responseRate: Number(e.responseRate || 0),
            averageRating: e.averageRating !== '' ? Number(e.averageRating) : null,
            npsScore: e.npsScore !== '' ? Number(e.npsScore) : null,
            departmentBreakdown: String(e.departmentBreakdown ?? ''),
            roleBreakdown: String(e.roleBreakdown ?? ''),
            lastCalculatedAt: parseDate(e.lastCalculatedAt) || new Date(),
            updatedAt: parseDate(e.updatedAt) || new Date(),
          })),
          skipDuplicates: true,
        });
      }

      if (sentimentAnalysisSheet.length > 0) {
        await tx.sentimentAnalysis.createMany({
          data: sentimentAnalysisSheet.map((s) => ({
            surveyId: surveyKey,
            averageSentiment: Number(s.averageSentiment || 0),
            positiveCount: Number(s.positiveCount || 0),
            neutralCount: Number(s.neutralCount || 0),
            negativeCount: Number(s.negativeCount || 0),
            topicsExtracted: String(s.topicsExtracted ?? ''),
            keywordFrequency: String(s.keywordFrequency ?? ''),
            analyzedAt: parseDate(s.analyzedAt) || new Date(),
            updatedAt: parseDate(s.updatedAt) || new Date(),
          })),
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Survey импорт амжилттай боллоо' }, { status: 200 });
  } catch (error: any) {
    console.error('Survey import detail error:', error);
    return NextResponse.json(
      { success: false, message: 'Survey импорт хийхэд алдаа гарлаа', error: error.message },
      { status: 500 }
    );
  }
}
