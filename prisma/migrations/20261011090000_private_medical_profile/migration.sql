BEGIN;
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile_code" VARCHAR(4),
ADD COLUMN     "profile_code_changed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProfileIdentifier" (
    "code" VARCHAR(4) NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileIdentifier_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "MedicalReport" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payload" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalReportFile" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "payload" BYTEA NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,

    CONSTRAINT "MedicalReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_code" VARCHAR(4) NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "payload" BYTEA NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "read_at" TIMESTAMP(3),
    "email_status" TEXT NOT NULL DEFAULT 'PENDING',
    "email_attempts" INTEGER NOT NULL DEFAULT 0,
    "email_next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_locked_until" TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileIdentifier_user_id_idx" ON "ProfileIdentifier"("user_id");

-- CreateIndex
CREATE INDEX "MedicalReport_user_id_created_at_idx" ON "MedicalReport"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "MedicalReportFile_report_id_idx" ON "MedicalReportFile"("report_id");

-- CreateIndex
CREATE INDEX "Prescription_user_id_created_at_idx" ON "Prescription"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Prescription_email_status_email_next_attempt_at_idx" ON "Prescription"("email_status", "email_next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_source_external_id_key" ON "Prescription"("source", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_profile_code_key" ON "User"("profile_code");

-- AddForeignKey
ALTER TABLE "ProfileIdentifier" ADD CONSTRAINT "ProfileIdentifier_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalReport" ADD CONSTRAINT "MedicalReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalReportFile" ADD CONSTRAINT "MedicalReportFile_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "MedicalReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill every existing registered user without changing their UUID or relationships.
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM "User") > 1679616 THEN
    RAISE EXCEPTION 'Four-character profile ID namespace exhausted (36^4).';
  END IF;
END $$;
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) - 1 AS n FROM "User"
), codes AS (
  SELECT id,
    SUBSTRING('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' FROM ((n / 46656) % 36 + 1)::int FOR 1) ||
    SUBSTRING('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' FROM ((n / 1296) % 36 + 1)::int FOR 1) ||
    SUBSTRING('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' FROM ((n / 36) % 36 + 1)::int FOR 1) ||
    SUBSTRING('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' FROM (n % 36 + 1)::int FOR 1) AS code
  FROM numbered
)
UPDATE "User" u SET profile_code = codes.code FROM codes WHERE codes.id = u.id;
INSERT INTO "ProfileIdentifier" (code, user_id) SELECT profile_code, id FROM "User";
ALTER TABLE "User" ALTER COLUMN "profile_code" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_profile_code_format" CHECK (profile_code ~ '^[A-Z0-9]{4}$');
ALTER TABLE "ProfileIdentifier" ADD CONSTRAINT "ProfileIdentifier_code_format" CHECK (code ~ '^[A-Z0-9]{4}$');
COMMIT;
