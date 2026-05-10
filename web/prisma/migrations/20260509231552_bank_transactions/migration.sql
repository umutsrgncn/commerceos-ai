-- CreateEnum
CREATE TYPE "BankTransactionStatus" AS ENUM ('UNMATCHED', 'AUTO_MATCHED', 'MANUAL_MATCHED', 'IGNORED');

-- CreateEnum
CREATE TYPE "BankTransactionDirection" AS ENUM ('IN', 'OUT');

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "bankAccountIban" TEXT,
ADD COLUMN     "bankMode" TEXT NOT NULL DEFAULT 'test',
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankWebhookSecret" TEXT;

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountIban" TEXT,
    "reference" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "description" TEXT NOT NULL,
    "direction" "BankTransactionDirection" NOT NULL,
    "source" TEXT NOT NULL,
    "status" "BankTransactionStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchedOrderId" TEXT,
    "matchConfidence" INTEGER,
    "matchReasoning" TEXT,
    "matchedAt" TIMESTAMP(3),
    "matchedBy" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankTransaction_status_transactionDate_idx" ON "BankTransaction"("status", "transactionDate");

-- CreateIndex
CREATE INDEX "BankTransaction_matchedOrderId_idx" ON "BankTransaction"("matchedOrderId");

-- CreateIndex
CREATE INDEX "BankTransaction_direction_status_idx" ON "BankTransaction"("direction", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_bankName_reference_key" ON "BankTransaction"("bankName", "reference");

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_matchedOrderId_fkey" FOREIGN KEY ("matchedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
