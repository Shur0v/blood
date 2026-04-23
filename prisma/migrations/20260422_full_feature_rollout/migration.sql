-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "blood_group" TEXT NOT NULL,
    "profile_image_url" TEXT,
    "location_city" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_formatted" TEXT,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_lng" DOUBLE PRECISION NOT NULL,
    "place_id" TEXT,
    "phone_country_name" TEXT,
    "phone_country_code" TEXT,
    "phone_dial_code" TEXT,
    "phone_local_number" TEXT,
    "is_active_donor" BOOLEAN NOT NULL DEFAULT true,
    "verification_status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "last_donation_date" TIMESTAMP(3),
    "health_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contact_country_name" TEXT,
    "contact_country_code" TEXT,
    "contact_dial_code" TEXT,
    "contact_local_number" TEXT,
    "contact_full_number" TEXT,
    "organ_type" TEXT NOT NULL,
    "location_city" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_formatted" TEXT,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_lng" DOUBLE PRECISION NOT NULL,
    "place_id" TEXT,
    "medical_note" TEXT,
    "prescription_image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reporter_contact" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "input_type" TEXT NOT NULL,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnswer" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "user_id" TEXT,
    "answers_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualBloodDonor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "phone_country_name" TEXT,
    "phone_country_code" TEXT,
    "phone_dial_code" TEXT,
    "phone_local_number" TEXT,
    "blood_group" TEXT NOT NULL,
    "location_city" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_formatted" TEXT,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_lng" DOUBLE PRECISION NOT NULL,
    "place_id" TEXT,
    "is_active_donor" BOOLEAN NOT NULL DEFAULT true,
    "verification_status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "last_donation_date" TIMESTAMP(3),
    "health_data" JSONB,
    "source" TEXT NOT NULL,
    "added_by_admin" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualBloodDonor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualOrganDonor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "phone_country_name" TEXT,
    "phone_country_code" TEXT,
    "phone_dial_code" TEXT,
    "phone_local_number" TEXT,
    "blood_group" TEXT,
    "organ_type" TEXT NOT NULL,
    "location_city" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "location_formatted" TEXT,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_lng" DOUBLE PRECISION NOT NULL,
    "place_id" TEXT,
    "source" TEXT NOT NULL,
    "added_by_admin" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualOrganDonor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT,
    "canonical_url" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "primary_keyword" TEXT,
    "secondary_keywords" JSONB,
    "published_at" TIMESTAMP(3),
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "seo_title" TEXT,
    "seo_desc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSlider" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "HomepageSlider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsClickLog" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsClickLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsHeatmapLog" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "click_x" DOUBLE PRECISION NOT NULL,
    "click_y" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsHeatmapLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrashRecord" (
    "id" TEXT NOT NULL,
    "original_table" TEXT NOT NULL,
    "deleted_data" JSONB NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrashRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalAidRequest" (
    "id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "hospital_name" TEXT NOT NULL,
    "amount_required" DOUBLE PRECISION NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_country_name" TEXT,
    "phone_country_code" TEXT,
    "phone_dial_code" TEXT,
    "phone_local_number" TEXT,
    "phone_full_number" TEXT,
    "medical_note" TEXT NOT NULL,
    "prescription_url" TEXT,
    "report_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalAidRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "total_raised" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed_ops" INTEGER NOT NULL DEFAULT 0,
    "uncompleted_ops" INTEGER NOT NULL DEFAULT 0,
    "weekly_donors" INTEGER NOT NULL DEFAULT 0,
    "donor_requests" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganPledge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organ_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganPledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "asset_url" TEXT NOT NULL,
    "review_status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewer_admin_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT,
    "category" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorStatusHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "previous_is_active" BOOLEAN NOT NULL,
    "new_is_active" BOOLEAN NOT NULL,
    "last_donation_date" TIMESTAMP(3),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonorStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserServiceCity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "formatted_location" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "provider_place_id" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserServiceCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "id" TEXT NOT NULL,
    "fingerprint_hash" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signup_count" INTEGER NOT NULL DEFAULT 0,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkFingerprint" (
    "id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "asn" TEXT,
    "geo_country" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRiskEvent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "fingerprint_hash" TEXT,
    "ip_hash" TEXT,
    "score_delta" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthRiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestrictedIdentity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "fingerprint_hash" TEXT,
    "ip_hash" TEXT,
    "reason" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_admin" TEXT NOT NULL,

    CONSTRAINT "RestrictedIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "User_is_active_donor_blood_group_location_country_location__idx" ON "User"("is_active_donor", "blood_group", "location_country", "location_city", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_admin_id_key" ON "AdminUser"("admin_id");

-- CreateIndex
CREATE INDEX "OrganRequest_status_created_at_idx" ON "OrganRequest"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Report_status_created_at_idx" ON "Report"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ManualBloodDonor_mobile_key" ON "ManualBloodDonor"("mobile");

-- CreateIndex
CREATE INDEX "ManualBloodDonor_is_active_donor_blood_group_location_count_idx" ON "ManualBloodDonor"("is_active_donor", "blood_group", "location_country", "location_city", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ManualOrganDonor_mobile_key" ON "ManualOrganDonor"("mobile");

-- CreateIndex
CREATE INDEX "ManualOrganDonor_location_country_location_city_created_at_idx" ON "ManualOrganDonor"("location_country", "location_city", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_status_created_at_idx" ON "Blog"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Blog_status_published_at_idx" ON "Blog"("status", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Policy_type_key" ON "Policy"("type");

-- CreateIndex
CREATE INDEX "AnalyticsClickLog_page_created_at_idx" ON "AnalyticsClickLog"("page", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsClickLog_device_type_created_at_idx" ON "AnalyticsClickLog"("device_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsHeatmapLog_page_created_at_idx" ON "AnalyticsHeatmapLog"("page", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsHeatmapLog_device_type_created_at_idx" ON "AnalyticsHeatmapLog"("device_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "MedicalAidRequest_status_created_at_idx" ON "MedicalAidRequest"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "OtpVerification_email_key" ON "OtpVerification"("email");

-- CreateIndex
CREATE INDEX "OrganPledge_organ_type_is_active_updated_at_idx" ON "OrganPledge"("organ_type", "is_active", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "OrganPledge_user_id_organ_type_key" ON "OrganPledge"("user_id", "organ_type");

-- CreateIndex
CREATE INDEX "VerificationDocument_review_status_created_at_idx" ON "VerificationDocument"("review_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "VerificationDocument_user_id_created_at_idx" ON "VerificationDocument"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storage_key_key" ON "MediaAsset"("storage_key");

-- CreateIndex
CREATE INDEX "DonorStatusHistory_user_id_changed_at_idx" ON "DonorStatusHistory"("user_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "UserServiceCity_city_country_created_at_idx" ON "UserServiceCity"("city", "country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "UserServiceCity_user_id_locked_until_idx" ON "UserServiceCity"("user_id", "locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "UserServiceCity_user_id_provider_place_id_key" ON "UserServiceCity"("user_id", "provider_place_id");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_fingerprint_hash_key" ON "DeviceFingerprint"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_risk_score_updated_at_idx" ON "DeviceFingerprint"("risk_score", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkFingerprint_ip_hash_key" ON "NetworkFingerprint"("ip_hash");

-- CreateIndex
CREATE INDEX "NetworkFingerprint_risk_score_updated_at_idx" ON "NetworkFingerprint"("risk_score", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "AuthRiskEvent_created_at_idx" ON "AuthRiskEvent"("created_at" DESC);

-- CreateIndex
CREATE INDEX "AuthRiskEvent_event_type_created_at_idx" ON "AuthRiskEvent"("event_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AuthRiskEvent_fingerprint_hash_created_at_idx" ON "AuthRiskEvent"("fingerprint_hash", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AuthRiskEvent_ip_hash_created_at_idx" ON "AuthRiskEvent"("ip_hash", "created_at" DESC);

-- CreateIndex
CREATE INDEX "RestrictedIdentity_is_active_created_at_idx" ON "RestrictedIdentity"("is_active", "created_at" DESC);

-- CreateIndex
CREATE INDEX "RestrictedIdentity_user_id_is_active_idx" ON "RestrictedIdentity"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "RestrictedIdentity_fingerprint_hash_is_active_idx" ON "RestrictedIdentity"("fingerprint_hash", "is_active");

-- CreateIndex
CREATE INDEX "RestrictedIdentity_ip_hash_is_active_idx" ON "RestrictedIdentity"("ip_hash", "is_active");

-- AddForeignKey
ALTER TABLE "OrganRequest" ADD CONSTRAINT "OrganRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganPledge" ADD CONSTRAINT "OrganPledge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorStatusHistory" ADD CONSTRAINT "DonorStatusHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserServiceCity" ADD CONSTRAINT "UserServiceCity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthRiskEvent" ADD CONSTRAINT "AuthRiskEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

