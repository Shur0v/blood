import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { DEFAULT_UI_THEME } from "@/src/lib/uiTheme";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prisma = getPrisma();
    const settings = await prisma.platformSettings.findFirst({
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
      select: {
        ui_theme: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        uiTheme: settings?.ui_theme || DEFAULT_UI_THEME,
        updatedAt: settings?.updated_at || null,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load public theme." }, { status: 500 });
  }
}
