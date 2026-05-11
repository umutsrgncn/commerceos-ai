-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "aiSegment" TEXT,
ADD COLUMN     "aiSegmentConfidence" INTEGER,
ADD COLUMN     "aiSegmentUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "recurringParentId" TEXT,
ADD COLUMN     "recurringRule" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "aiFlagReason" TEXT,
ADD COLUMN     "aiFlagSentiment" TEXT,
ADD COLUMN     "aiFlagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CustomerEmail" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "campaignTag" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerEmail_customerId_createdAt_idx" ON "CustomerEmail"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerEmail_campaignTag_createdAt_idx" ON "CustomerEmail"("campaignTag", "createdAt");

-- CreateIndex
CREATE INDEX "Customer_aiSegment_idx" ON "Customer"("aiSegment");

-- CreateIndex
CREATE INDEX "Expense_recurringRule_recurringParentId_idx" ON "Expense"("recurringRule", "recurringParentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingNumber_key" ON "Order"("trackingNumber");

-- CreateIndex
CREATE INDEX "ProductReview_aiFlagged_isPublished_idx" ON "ProductReview"("aiFlagged", "isPublished");

-- AddForeignKey
ALTER TABLE "CustomerEmail" ADD CONSTRAINT "CustomerEmail_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringParentId_fkey" FOREIGN KEY ("recurringParentId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

