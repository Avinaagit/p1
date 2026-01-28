-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT,
    "locationName" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetDepartment" TEXT,
    "targetRoles" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "nextScheduledDate" TIMESTAMP(3),
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT,
    "anonymousId" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentimentAnalysis" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "averageSentiment" DOUBLE PRECISION NOT NULL,
    "positiveCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "negativeCount" INTEGER NOT NULL DEFAULT 0,
    "topicsExtracted" TEXT,
    "keywordFrequency" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SentimentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentimentDetail" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL,
    "sentimentLabel" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "emotionAnalysis" TEXT,
    "keywordsDetected" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentimentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementMetric" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "totalDistributed" INTEGER NOT NULL DEFAULT 0,
    "totalResponded" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "npsScore" DOUBLE PRECISION,
    "departmentBreakdown" TEXT,
    "roleBreakdown" TEXT,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT NOT NULL,
    "surveyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "deadline" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "relatedMetrics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layout" TEXT,
    "selectedMetrics" TEXT,
    "refreshInterval" INTEGER NOT NULL DEFAULT 300,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "surveyId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "Survey_status_idx" ON "Survey"("status");

-- CreateIndex
CREATE INDEX "Survey_startDate_idx" ON "Survey"("startDate");

-- CreateIndex
CREATE INDEX "Survey_createdBy_idx" ON "Survey"("createdBy");

-- CreateIndex
CREATE INDEX "Survey_nextScheduledDate_idx" ON "Survey"("nextScheduledDate");

-- CreateIndex
CREATE INDEX "SurveyQuestion_surveyId_idx" ON "SurveyQuestion"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyResponse_respondentId_idx" ON "SurveyResponse"("respondentId");

-- CreateIndex
CREATE INDEX "SurveyResponse_submittedAt_idx" ON "SurveyResponse"("submittedAt");

-- CreateIndex
CREATE INDEX "QuestionResponse_responseId_idx" ON "QuestionResponse"("responseId");

-- CreateIndex
CREATE INDEX "QuestionResponse_questionId_idx" ON "QuestionResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SentimentAnalysis_surveyId_key" ON "SentimentAnalysis"("surveyId");

-- CreateIndex
CREATE INDEX "SentimentAnalysis_surveyId_idx" ON "SentimentAnalysis"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "SentimentDetail_responseId_key" ON "SentimentDetail"("responseId");

-- CreateIndex
CREATE INDEX "SentimentDetail_responseId_idx" ON "SentimentDetail"("responseId");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementMetric_surveyId_key" ON "EngagementMetric"("surveyId");

-- CreateIndex
CREATE INDEX "EngagementMetric_surveyId_idx" ON "EngagementMetric"("surveyId");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_deadline_idx" ON "Task"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardPreference_userId_key" ON "DashboardPreference"("userId");

-- CreateIndex
CREATE INDEX "DashboardPreference_userId_idx" ON "DashboardPreference"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_surveyId_idx" ON "Notification"("surveyId");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SentimentAnalysis" ADD CONSTRAINT "SentimentAnalysis_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentimentDetail" ADD CONSTRAINT "SentimentDetail_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementMetric" ADD CONSTRAINT "EngagementMetric_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardPreference" ADD CONSTRAINT "DashboardPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
