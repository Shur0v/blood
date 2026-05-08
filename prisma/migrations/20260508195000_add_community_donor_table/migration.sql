-- CreateTable
CREATE TABLE "CommunityDonor" (
  "id" TEXT NOT NULL,
  "organization_name" TEXT NOT NULL,
  "contact_person" TEXT,
  "mobile" TEXT NOT NULL,
  "phone_country_name" TEXT,
  "phone_country_code" TEXT,
  "phone_dial_code" TEXT,
  "phone_local_number" TEXT,
  "location_city" TEXT NOT NULL,
  "location_country" TEXT NOT NULL,
  "location_formatted" TEXT,
  "location_lat" DOUBLE PRECISION NOT NULL,
  "location_lng" DOUBLE PRECISION NOT NULL,
  "place_id" TEXT,
  "source" TEXT NOT NULL,
  "added_by_admin" TEXT NOT NULL,
  "verification_status" TEXT NOT NULL DEFAULT 'VERIFIED',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityDonor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityDonor_mobile_key" ON "CommunityDonor"("mobile");

-- CreateIndex
CREATE INDEX "CommunityDonor_is_active_location_country_location_city_created_at_idx"
ON "CommunityDonor"("is_active", "location_country", "location_city", "created_at");
