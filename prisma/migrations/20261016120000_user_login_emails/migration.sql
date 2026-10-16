-- Existing primary emails and account data remain unchanged.
CREATE TABLE "UserLoginEmail" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserLoginEmail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserLoginEmail_normalized" CHECK ("email" = lower(trim("email")))
);
CREATE UNIQUE INDEX "UserLoginEmail_email_key" ON "UserLoginEmail"("email");
CREATE INDEX "UserLoginEmail_user_id_idx" ON "UserLoginEmail"("user_id");
ALTER TABLE "UserLoginEmail" ADD CONSTRAINT "UserLoginEmail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
