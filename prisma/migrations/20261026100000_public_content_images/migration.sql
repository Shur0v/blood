ALTER TABLE "MediaAsset" ADD COLUMN "public_metadata" JSONB, ADD COLUMN "variants" JSONB;
ALTER TABLE "HomepageSlider" ADD COLUMN "public_image" JSONB, ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Blog" ADD COLUMN "public_image" JSONB;
CREATE TABLE "PublicPageContent" ("key" TEXT PRIMARY KEY,"draft" JSONB NOT NULL DEFAULT '{}',"live" JSONB,"public_updated_at" TIMESTAMP(3),"updated_at" TIMESTAMP(3) NOT NULL);
CREATE TABLE "ServiceAvailability" ("key" TEXT PRIMARY KEY,"country" TEXT NOT NULL,"city" TEXT,"draft" JSONB NOT NULL DEFAULT '{}',"live" JSONB,"public_updated_at" TIMESTAMP(3),"updated_at" TIMESTAMP(3) NOT NULL);
