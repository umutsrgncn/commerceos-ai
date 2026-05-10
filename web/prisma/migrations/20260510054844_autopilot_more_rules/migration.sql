-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "autoPilotAutoAnalyzeReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPilotAutoConfirmOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoPilotAutoMatchBank" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPilotAutoSegmentCustomers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPilotAutoSuggestPrice" BOOLEAN NOT NULL DEFAULT false;
