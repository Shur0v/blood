-- DropIndex
DROP INDEX IF EXISTS "CommunityDonor_mobile_key";

-- CreateIndex
CREATE UNIQUE INDEX "CommunityDonor_organization_name_key" ON "CommunityDonor"("organization_name");
