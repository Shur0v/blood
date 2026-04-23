-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "author_type" TEXT NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false;
