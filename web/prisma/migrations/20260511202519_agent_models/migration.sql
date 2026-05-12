-- CreateEnum
CREATE TYPE "AgentTaskStatus" AS ENUM ('PENDING', 'PLANNING', 'RUNNING', 'TESTING', 'REVIEW', 'MERGED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentEventType" AS ENUM ('STATUS', 'THINK', 'TOOL_CALL', 'TOOL_RESULT', 'FILE_WRITE', 'TEST_RUN', 'SCREENSHOT', 'TUNNEL', 'COMMIT', 'ERROR', 'NOTE');

-- CreateEnum
CREATE TYPE "AgentTestStatus" AS ENUM ('PASSED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "branchName" TEXT,
    "worktreePath" TEXT,
    "port" INTEGER,
    "tunnelUrl" TEXT,
    "planJson" JSONB,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "iterations" INTEGER NOT NULL DEFAULT 0,
    "errorMsg" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" "AgentEventType" NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentScreenshot" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTestRun" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AgentTestStatus" NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "output" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentTestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentTask_status_createdAt_idx" ON "AgentTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AgentEvent_taskId_createdAt_idx" ON "AgentEvent"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentEvent_taskId_seq_key" ON "AgentEvent"("taskId", "seq");

-- CreateIndex
CREATE INDEX "AgentScreenshot_taskId_createdAt_idx" ON "AgentScreenshot"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTestRun_taskId_status_idx" ON "AgentTestRun"("taskId", "status");

-- AddForeignKey
ALTER TABLE "AgentEvent" ADD CONSTRAINT "AgentEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgentTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentScreenshot" ADD CONSTRAINT "AgentScreenshot_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgentTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTestRun" ADD CONSTRAINT "AgentTestRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgentTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
