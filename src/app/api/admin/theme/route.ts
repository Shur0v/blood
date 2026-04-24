import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from "@/src/backend/utils/session";
import { DEFAULT_UI_THEME, UI_THEME_KEYS } from "@/src/lib/uiTheme";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ThemeSchema = z.object({
  uiTheme: z.enum(UI_THEME_KEYS),
});

const getLatestSettings = async (prisma: ReturnType<typeof getPrisma>) =>
  prisma.platformSettings.findFirst({
    orderBy: [{ updated_at: "desc" }, { id: "desc" }],
  });

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
    let settings = await getLatestSettings(prisma);
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          ui_theme: DEFAULT_UI_THEME,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        uiTheme: settings.ui_theme || DEFAULT_UI_THEME,
        updatedAt: settings.updated_at,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load theme settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = ThemeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid theme payload." }, { status: 400 });
    }

    const prisma = getPrisma();
    let settings = await getLatestSettings(prisma);
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          ui_theme: parsed.data.uiTheme,
        },
      });
    } else {
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: { ui_theme: parsed.data.uiTheme },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        uiTheme: settings.ui_theme || DEFAULT_UI_THEME,
        updatedAt: settings.updated_at,
      },
      message: "Theme updated successfully.",
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update theme." }, { status: 500 });
  }
}
