import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { total_raised, total_spent, completed_ops, uncompleted_ops, weekly_donors } = body;

    let stats = await prisma.platformSettings.findFirst();

    if (stats) {
      stats = await prisma.platformSettings.update({
        where: { id: stats.id },
        data: {
          total_raised: parseFloat(total_raised) || stats.total_raised,
          total_spent: parseFloat(total_spent) || stats.total_spent,
          completed_ops: parseInt(completed_ops) || stats.completed_ops,
          uncompleted_ops: parseInt(uncompleted_ops) || stats.uncompleted_ops,
          weekly_donors: parseInt(weekly_donors) || stats.weekly_donors,
        }
      });
    } else {
      stats = await prisma.platformSettings.create({
        data: {
          total_raised: parseFloat(total_raised) || 0,
          total_spent: parseFloat(total_spent) || 0,
          completed_ops: parseInt(completed_ops) || 0,
          uncompleted_ops: parseInt(uncompleted_ops) || 0,
          weekly_donors: parseInt(weekly_donors) || 0,
        }
      });
    }

    return NextResponse.json({ success: true, data: stats, message: "Platform Statistics Successfully Synchronized." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to update platform statistics." }, { status: 500 });
  }
}
