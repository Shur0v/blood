ALTER TABLE "PublicDonorProfile"
  ADD COLUMN "admin_approved_at" TIMESTAMP(3),
  ADD COLUMN "admin_approved_by" TEXT,
  ADD COLUMN "article_template" INTEGER NOT NULL DEFAULT 0;

-- Existing donor-written profiles require an explicit administrator review.
-- Preserve all introductions and consent records for that review.
UPDATE "PublicDonorProfile" SET "is_published" = false;
