-- AlterTable
ALTER TABLE "AnalyticsHeatmapLog" ADD COLUMN     "event_type" TEXT NOT NULL DEFAULT 'click',
ADD COLUMN     "scroll_depth" INTEGER,
ADD COLUMN     "session_id" TEXT,
ADD COLUMN     "viewport_h" INTEGER,
ADD COLUMN     "viewport_w" INTEGER,
ALTER COLUMN "click_x" DROP NOT NULL,
ALTER COLUMN "click_y" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AnalyticsHeatmapLog_page_event_type_created_at_idx" ON "AnalyticsHeatmapLog"("page", "event_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsHeatmapLog_session_id_created_at_idx" ON "AnalyticsHeatmapLog"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsHeatmapLog_event_type_created_at_idx" ON "AnalyticsHeatmapLog"("event_type", "created_at" DESC);
