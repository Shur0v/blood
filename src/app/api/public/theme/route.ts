import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { DEFAULT_UI_THEME } from "@/src/lib/uiTheme";

export async function GET() {
  try {
    const prisma = getPrisma();
    const settings = await prisma.platformSettings.findFirst({
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
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load public theme." }, { status: 500 });
  }
}
