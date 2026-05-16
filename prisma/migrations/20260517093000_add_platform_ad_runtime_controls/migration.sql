-- Add global ad runtime controls into platform settings
ALTER TABLE "PlatformSettings"
ADD COLUMN IF NOT EXISTS "ads_runtime_enabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "PlatformSettings"
ADD COLUMN IF NOT EXISTS "ad_units_json" JSONB;

