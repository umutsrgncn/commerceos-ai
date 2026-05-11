-- CreateEnum
CREATE TYPE "DataDeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "cookieBannerEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dataController" TEXT,
ADD COLUMN     "dpoEmail" TEXT,
ADD COLUMN     "privacyPolicyText" TEXT,
ADD COLUMN     "privacyPolicyUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "reason" TEXT,
    "status" "DataDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataDeletionRequest_status_createdAt_idx" ON "DataDeletionRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_customerEmail_idx" ON "DataDeletionRequest"("customerEmail");

-- AddForeignKey
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

