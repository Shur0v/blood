import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const requests = await prisma.medicalAidRequest.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch medical aid requests." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "Missing request ID or status." }, { status: 400 });
    }

    const updatedRequest = await prisma.medicalAidRequest.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: updatedRequest, message: `Request successfully marked as ${status}.` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to update request status." }, { status: 500 });
  }
}
