import { NextResponse } from "next/server";
import { gzipSync } from "zlib";
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from "@/src/backend/utils/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TableNameRow = { table_name: string };

const replacer = (_key: string, value: unknown) => {
  if (typeof value === "bigint") return value.toString();
  return value;
};

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const tables = await prisma.$queryRaw<TableNameRow[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `;

    const snapshot: Record<string, unknown[]> = {};
    for (const row of tables) {
      const tableName = row.table_name;
      const safeTableName = tableName.replace(/"/g, "");
      const data = await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM "public"."${safeTableName}"`);
      snapshot[safeTableName] = data;
    }

    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportedByAdminId: session.user_id,
        schema: "public",
        tables: tables.map((t) => t.table_name),
      },
      data: snapshot,
    };

    const json = JSON.stringify(payload, replacer, 2);
    const gz = gzipSync(Buffer.from(json, "utf-8"), { level: 9 });
    const fileStamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `bloodnet-db-backup-${fileStamp}.json.gz`;

    return new NextResponse(gz, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to generate database backup." }, { status: 500 });
  }
}
