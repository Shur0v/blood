ALTER TABLE "PlatformSettings" ADD COLUMN "city_donation_request_visible" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "RegionalPageContent" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "country" TEXT NOT NULL,
  "city" TEXT,
  "title" TEXT NOT NULL DEFAULT '',
  "summary" TEXT NOT NULL DEFAULT '',
  "slides" JSONB NOT NULL DEFAULT '[]',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "public_updated_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "RegionalPageContent_country_city_idx" ON "RegionalPageContent"("country", "city");
