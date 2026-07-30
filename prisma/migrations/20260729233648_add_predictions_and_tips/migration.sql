-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "predictedTime" DATETIME NOT NULL,
    "confidence" REAL NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedActualTime" DATETIME,
    CONSTRAINT "Prediction_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "babyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ageDaysMin" INTEGER,
    "ageDaysMax" INTEGER,
    "shownAt" DATETIME,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "usefulFeedback" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Prediction_babyId_eventType_generatedAt_idx" ON "Prediction"("babyId", "eventType", "generatedAt");

-- CreateIndex
CREATE INDEX "Tip_babyId_dismissed_idx" ON "Tip"("babyId", "dismissed");
