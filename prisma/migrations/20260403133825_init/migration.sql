-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ageGroup" TEXT,
    "familyType" TEXT,
    "lifestyle" TEXT,
    "insurance" TEXT,
    "risks" TEXT,
    "chronicCondition" TEXT,
    "pregnancyStatus" TEXT,
    "estimatedSavings" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "action" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "premiums" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "familyDiscount" REAL NOT NULL DEFAULT 0.10,
    "newBizDiscount" REAL NOT NULL DEFAULT 0.05,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_sessionId_key" ON "Lead"("sessionId");
