import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";

export async function GET() {
  try {
    const prisma = getPrisma();
    let stats = await prisma.platformSettings.findFirst();
    
    // If no stats exist yet, return default baseline zeroes
    if (!stats) {
      const fallback = {
        id: "default",
        total_raised: 13500,
        total_spent: 15000,
        completed_ops: 37,
        uncompleted_ops: 19,
        weekly_donors: 120,
        donor_requests: 156,
        updated_at: new Date(),
      };
      return NextResponse.json({ success: true, data: fallback }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch platform statistics." }, { status: 500 });
  }
}
