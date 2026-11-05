CREATE TABLE "IndiaEditorialPage" (
 "area_id" TEXT NOT NULL PRIMARY KEY,
 "draft" JSONB NOT NULL DEFAULT '{}',
 "live" JSONB,
 "published" BOOLEAN NOT NULL DEFAULT false,
 "public_updated_at" TIMESTAMP(3),
 "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE TRIGGER bloodnet_maintenance_write_guard BEFORE INSERT OR UPDATE OR DELETE ON "IndiaEditorialPage"
FOR EACH ROW EXECUTE FUNCTION bloodnet_maintenance_write_guard();
