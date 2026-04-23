import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/src/backend/config/db";

const EventSchema = z.object({
  page: z.string().min(1).max(120),
  component: z.string().min(1).max(120),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  timestamp: z.string().datetime().optional(),
});

const PayloadSchema = z.object({
  events: z.array(EventSchema).min(1).max(100),
});

export async function POST(req: Request) {
  try {
    const parsed = PayloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid analytics payload." }, { status: 400 });
    }

    const now = new Date();
    const rows = parsed.data.events.map((event) => {
      const eventDate = event.timestamp ? new Date(event.timestamp) : now;
      const createdAt = Number.isNaN(eventDate.getTime()) ? now : eventDate;
      return {
        page: event.page,
        component: event.component,
        device_type: event.deviceType,
        created_at: createdAt,
      };
    });

    await getPrisma().analyticsClickLog.createMany({
      data: rows,
      skipDuplicates: false,
    });

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to store analytics events." }, { status: 500 });
  }
}
