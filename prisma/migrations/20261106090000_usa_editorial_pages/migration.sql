CREATE TABLE "UsaEditorialPage" (
  "area_id" TEXT NOT NULL,
  "draft" JSONB NOT NULL DEFAULT '{}',
  "live" JSONB,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "public_updated_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsaEditorialPage_pkey" PRIMARY KEY ("area_id")
);
CREATE TRIGGER bloodnet_maintenance_write_guard BEFORE INSERT OR UPDATE OR DELETE ON "UsaEditorialPage"
FOR EACH ROW EXECUTE FUNCTION bloodnet_maintenance_write_guard();
