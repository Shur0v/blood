-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP(3);
