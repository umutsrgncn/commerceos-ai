-- CreateTable
CREATE TABLE "SalesGoal" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "targetAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesGoal_period_key" ON "SalesGoal"("period");
