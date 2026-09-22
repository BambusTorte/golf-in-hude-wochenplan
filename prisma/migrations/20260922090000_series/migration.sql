-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT,
    "course" TEXT,
    "holes" INTEGER,
    "tee" TEXT,
    "format" TEXT,
    "playType" "PlayType",
    "participantsEstimate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Series_active_weekday_idx" ON "Series"("active", "weekday");

-- AlterTable
ALTER TABLE "PlanEvent" ADD COLUMN "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "PlanEvent_seriesId_idx" ON "PlanEvent"("seriesId");

-- AddForeignKey
ALTER TABLE "PlanEvent" ADD CONSTRAINT "PlanEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
