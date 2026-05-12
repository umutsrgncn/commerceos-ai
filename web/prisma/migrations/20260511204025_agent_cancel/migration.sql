-- AlterEnum
ALTER TYPE "AgentTaskStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "AgentTask" ADD COLUMN     "cancelRequested" BOOLEAN NOT NULL DEFAULT false;
