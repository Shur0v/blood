CREATE TABLE "LocationSettings" (
    "id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocationSettings_pkey" PRIMARY KEY ("id")
);
