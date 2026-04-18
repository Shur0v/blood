import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    let stats = await prisma.platformSettings.findFirst();
    
    // If no stats exist yet, return default baseline zeroes
    if (!stats) {
      stats = {
        id: "default",
        total_raised: 13500,
        total_spent: 15000,
        completed_ops: 37,
        uncompleted_ops: 19,
        weekly_donors: 120,
        updated_at: new Date()
      };
    }
    
    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch platform statistics." }, { status: 500 });
  }
}
