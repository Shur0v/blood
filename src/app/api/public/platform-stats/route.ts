import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicBotStats } from "@/src/backend/services/seoData";
import { DEFAULT_UI_THEME } from "@/src/lib/uiTheme";

export async function GET() {
  try {
    const prisma = getPrisma();
    let stats = await prisma.platformSettings.findFirst({
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
    });
    
    if (!stats) {
      stats = await prisma.platformSettings.create({
        data: {
          total_raised: 0,
          total_spent: 0,
          completed_ops: 0,
          uncompleted_ops: 0,
          weekly_donors: 0,
          donor_requests: 0,
          ui_theme: DEFAULT_UI_THEME,
        },
      });
    }

    const publicNetwork = await getPublicBotStats();
    return NextResponse.json(
      {
        success: true,
        data: {
          ...stats,
          publicNetwork,
        },
        meta: {
          lastUpdated: publicNetwork.lastUpdated,
          cache: "public, s-maxage=300, stale-while-revalidate=1800",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch platform statistics." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
