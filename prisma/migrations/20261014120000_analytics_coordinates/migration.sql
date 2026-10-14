-- Additive only. Legacy coordinates remain explicitly marked as viewport data.
ALTER TABLE "AnalyticsClickLog" ADD COLUMN "event_key" TEXT;
CREATE UNIQUE INDEX "AnalyticsClickLog_event_key_key" ON "AnalyticsClickLog"("event_key");
ALTER TABLE "AnalyticsHeatmapLog" ADD COLUMN "event_key" TEXT,
  ADD COLUMN "coordinate_space" TEXT NOT NULL DEFAULT 'viewport',
  ADD COLUMN "document_w" INTEGER, ADD COLUMN "document_h" INTEGER,
  ADD COLUMN "target_path" TEXT, ADD COLUMN "target_x" DOUBLE PRECISION, ADD COLUMN "target_y" DOUBLE PRECISION;
CREATE UNIQUE INDEX "AnalyticsHeatmapLog_event_key_key" ON "AnalyticsHeatmapLog"("event_key");
