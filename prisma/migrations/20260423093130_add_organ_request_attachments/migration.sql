-- CreateTable
CREATE TABLE "OrganRequestAttachment" (
    "id" TEXT NOT NULL,
    "organ_request_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganRequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganRequestAttachment_organ_request_id_created_at_idx" ON "OrganRequestAttachment"("organ_request_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "OrganRequestAttachment" ADD CONSTRAINT "OrganRequestAttachment_organ_request_id_fkey" FOREIGN KEY ("organ_request_id") REFERENCES "OrganRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
