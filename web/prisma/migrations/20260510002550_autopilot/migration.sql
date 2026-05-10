-- CreateEnum
CREATE TYPE "AutoPilotActionType" AS ENUM ('REVIEW_REPLY', 'INVOICE_ISSUE', 'STOCK_REORDER', 'BANK_MATCH', 'ORDER_CONFIRM');

-- CreateEnum
CREATE TYPE "AutoPilotActionStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "autoPilotAutoIssueInvoices" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPilotAutoReorderStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPilotAutoReplyReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPilotConfidenceThreshold" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "autoPilotEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoPilotEnabledAt" TIMESTAMP(3),
ADD COLUMN     "autoPilotMonthlyBudgetMinor" INTEGER;

-- CreateTable
CREATE TABLE "AutoPilotAction" (
    "id" TEXT NOT NULL,
    "type" "AutoPilotActionType" NOT NULL,
    "status" "AutoPilotActionStatus" NOT NULL DEFAULT 'PENDING',
    "triggerSource" TEXT NOT NULL,
    "triggerSummary" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasoning" TEXT,
    "confidence" INTEGER,
    "resultRef" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoPilotAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "contactPerson" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "productSkus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "leadTimeDays" INTEGER DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoPilotAction_status_createdAt_idx" ON "AutoPilotAction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AutoPilotAction_type_createdAt_idx" ON "AutoPilotAction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AutoPilotAction_triggerSource_idx" ON "AutoPilotAction"("triggerSource");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");
