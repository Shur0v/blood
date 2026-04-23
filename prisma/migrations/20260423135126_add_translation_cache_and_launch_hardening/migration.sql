-- CreateTable
CREATE TABLE "TranslatedContent" (
    "id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_version" TEXT,
    "translated_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslatedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslatedContent_locale_content_type_updated_at_idx" ON "TranslatedContent"("locale", "content_type", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TranslatedContent_source_hash_locale_content_type_content_v_key" ON "TranslatedContent"("source_hash", "locale", "content_type", "content_version");
