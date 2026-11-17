-- CreateTable
CREATE TABLE "EmergencySmsBranch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "opens_minute" INTEGER NOT NULL DEFAULT 0,
    "closes_minute" INTEGER NOT NULL DEFAULT 1440,
    "sponsor_remaining" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencySmsBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySmsConsent" (
    "user_id" TEXT NOT NULL,
    "phone_digest" TEXT NOT NULL,
    "point" BYTEA NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'bn',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_contact_at" TIMESTAMP(3),

    CONSTRAINT "EmergencySmsConsent_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "EmergencySmsAccess" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "accepted_user_id" TEXT,
    "invite_digest" TEXT,
    "invite_expires" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "EmergencySmsAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySmsRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "branch_id" TEXT NOT NULL,
    "reference_digest" TEXT NOT NULL,
    "reference" BYTEA NOT NULL,
    "blood_group" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "needed_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "funding" TEXT,
    "charged_paisa" INTEGER NOT NULL DEFAULT 0,
    "refund_paisa" INTEGER NOT NULL DEFAULT 0,
    "template_version" TEXT,
    "next_batch_at" TIMESTAMP(3),
    "pilot_second_approved" BOOLEAN NOT NULL DEFAULT false,
    "covered_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencySmsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySmsDelivery" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "donor_id" TEXT NOT NULL,
    "phone_digest" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencySmsDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySmsAudit" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "request_id" TEXT,
    "event" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencySmsAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySmsTemplate" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "EmergencySmsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmergencySmsAccess_invite_digest_key" ON "EmergencySmsAccess"("invite_digest");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencySmsAccess_branch_id_email_role_key" ON "EmergencySmsAccess"("branch_id", "email", "role");

-- CreateIndex
CREATE INDEX "EmergencySmsRequest_user_id_created_at_idx" ON "EmergencySmsRequest"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "EmergencySmsRequest_status_next_batch_at_idx" ON "EmergencySmsRequest"("status", "next_batch_at");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencySmsRequest_branch_id_reference_digest_key" ON "EmergencySmsRequest"("branch_id", "reference_digest");

-- CreateIndex
CREATE INDEX "EmergencySmsDelivery_donor_id_created_at_idx" ON "EmergencySmsDelivery"("donor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencySmsDelivery_request_id_phone_digest_key" ON "EmergencySmsDelivery"("request_id", "phone_digest");

-- CreateIndex
CREATE INDEX "EmergencySmsAudit_created_at_idx" ON "EmergencySmsAudit"("created_at");

-- CreateIndex
CREATE INDEX "EmergencySmsTemplate_language_status_published_at_idx" ON "EmergencySmsTemplate"("language", "status", "published_at");

-- AddForeignKey
ALTER TABLE "EmergencySmsConsent" ADD CONSTRAINT "EmergencySmsConsent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySmsAccess" ADD CONSTRAINT "EmergencySmsAccess_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "EmergencySmsBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySmsRequest" ADD CONSTRAINT "EmergencySmsRequest_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "EmergencySmsBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySmsRequest" ADD CONSTRAINT "EmergencySmsRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySmsDelivery" ADD CONSTRAINT "EmergencySmsDelivery_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "EmergencySmsRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
