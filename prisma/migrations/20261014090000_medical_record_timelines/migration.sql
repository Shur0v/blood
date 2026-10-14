BEGIN;
ALTER TABLE "MedicalReport"
  ADD COLUMN "record_kind" TEXT NOT NULL DEFAULT 'REPORT',
  ADD COLUMN "record_date" DATE,
  ADD COLUMN "upload_key" TEXT,
  ADD COLUMN "request_hash" TEXT;
ALTER TABLE "MedicalReport" ADD CONSTRAINT "MedicalReport_record_kind_check" CHECK (record_kind IN ('REPORT', 'PRESCRIPTION'));
CREATE INDEX "MedicalReport_user_id_record_kind_record_date_id_idx" ON "MedicalReport"("user_id", "record_kind", "record_date" DESC, "id" DESC);
CREATE UNIQUE INDEX "MedicalReport_user_id_upload_key_key" ON "MedicalReport"("user_id", "upload_key");
CREATE INDEX "Prescription_user_id_issued_at_id_idx" ON "Prescription"("user_id", "issued_at" DESC, "id" DESC);
-- Encrypted payloads and file bytes are untouched. Legacy dates are populated
-- privately, per owner, from the encrypted report date before listing history.
COMMIT;
