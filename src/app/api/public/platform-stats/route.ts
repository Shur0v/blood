import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { DEFAULT_UI_THEME } from "@/src/lib/uiTheme";

export async function GET() {
  try {
    const prisma = getPrisma();
    let stats = await prisma.platformSettings.findFirst();
    
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

    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch platform statistics." }, { status: 500 });
  }
}
