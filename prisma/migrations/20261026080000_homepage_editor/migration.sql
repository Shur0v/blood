CREATE TABLE "HomepageContent" (
    "key" TEXT NOT NULL,
    "draft" JSONB NOT NULL DEFAULT '{}',
    "live" JSONB,
    "public_updated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomepageContent_pkey" PRIMARY KEY ("key")
);
