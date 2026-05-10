-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "documentType" TEXT NOT NULL DEFAULT 'EFATURA';

-- CreateIndex
CREATE INDEX "Invoice_documentType_idx" ON "Invoice"("documentType");
