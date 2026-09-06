-- CreateTable
CREATE TABLE "MetricEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetricEvent_workspaceId_type_createdAt_idx" ON "MetricEvent"("workspaceId", "type", "createdAt");
