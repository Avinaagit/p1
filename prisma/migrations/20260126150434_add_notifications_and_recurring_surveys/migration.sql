-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "surveyId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "targetDepartment" TEXT,
    "targetRoles" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "nextScheduledDate" DATETIME,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Survey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
INSERT INTO "new_Survey" ("createdAt", "createdBy", "description", "endDate", "id", "isAnonymous", "startDate", "status", "targetDepartment", "targetRoles", "title", "updatedAt") SELECT "createdAt", "createdBy", "description", "endDate", "id", "isAnonymous", "startDate", "status", "targetDepartment", "targetRoles", "title", "updatedAt" FROM "Survey";
DROP TABLE "Survey";
ALTER TABLE "new_Survey" RENAME TO "Survey";
CREATE INDEX "Survey_status_idx" ON "Survey"("status");
CREATE INDEX "Survey_startDate_idx" ON "Survey"("startDate");
CREATE INDEX "Survey_createdBy_idx" ON "Survey"("createdBy");
CREATE INDEX "Survey_nextScheduledDate_idx" ON "Survey"("nextScheduledDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_surveyId_idx" ON "Notification"("surveyId");
