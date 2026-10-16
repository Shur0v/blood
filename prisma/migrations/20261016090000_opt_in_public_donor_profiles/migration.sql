-- Additive only. Existing donors are never enrolled or copied into public profiles.
CREATE TABLE "PublicDonorProfile" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "slug" VARCHAR(160) NOT NULL,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "phone_visible" BOOLEAN NOT NULL DEFAULT false,
  "bio" VARCHAR(1200) NOT NULL DEFAULT '',
  "consent_version" VARCHAR(32),
  "consented_at" TIMESTAMP(3),
  "phone_consented_at" TIMESTAMP(3),
  "withdrawn_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublicDonorProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicDonorProfile_user_id_key" ON "PublicDonorProfile"("user_id");
CREATE UNIQUE INDEX "PublicDonorProfile_slug_key" ON "PublicDonorProfile"("slug");
CREATE INDEX "PublicDonorProfile_is_published_updated_at_idx" ON "PublicDonorProfile"("is_published", "updated_at" DESC);
ALTER TABLE "PublicDonorProfile" ADD CONSTRAINT "PublicDonorProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
