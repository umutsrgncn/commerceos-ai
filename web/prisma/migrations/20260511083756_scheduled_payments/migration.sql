-- CreateEnum
CREATE TYPE "RecurrenceRule" AS ENUM ('MONTHLY', 'WEEKLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME');

-- CreateTable
CREATE TABLE "ScheduledPayment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "recurrence" "RecurrenceRule" NOT NULL DEFAULT 'MONTHLY',
    "dueDay" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "vendor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledPayment_active_startDate_idx" ON "ScheduledPayment"("active", "startDate");

-- CreateIndex
CREATE INDEX "ScheduledPayment_category_idx" ON "ScheduledPayment"("category");
