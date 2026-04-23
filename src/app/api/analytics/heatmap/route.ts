import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';

const EventSchema = z.object({
  page: z.string().min(1).max(120),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  eventType: z.enum(['click', 'scroll']).default('click'),
  sessionId: z.string().min(8).max(160).optional(),
  clickX: z.number().min(0).max(1).optional(),
  clickY: z.number().min(0).max(1).optional(),
  viewportW: z.number().int().min(100).max(10000).optional(),
  viewportH: z.number().int().min(100).max(10000).optional(),
  scrollDepth: z.number().int().min(0).max(100).optional(),
  timestamp: z.string().datetime().optional(),
}).superRefine((event, ctx) => {
  if (event.eventType === 'click') {
    if (typeof event.clickX !== 'number' || typeof event.clickY !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'clickX and clickY are required for click events.',
      });
    }
  }

  if (event.eventType === 'scroll') {
    if (typeof event.scrollDepth !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scrollDepth is required for scroll events.',
      });
    }
  }
});

const PayloadSchema = z.object({
  events: z.array(EventSchema).min(1).max(100),
});

export async function POST(req: Request) {
  try {
    const parsed = PayloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid heatmap payload.' }, { status: 400 });
    }

    const now = new Date();
    const rows = parsed.data.events.map((event) => {
      const ts = event.timestamp ? new Date(event.timestamp) : now;
      const createdAt = Number.isNaN(ts.getTime()) ? now : ts;
      return {
        page: event.page,
        device_type: event.deviceType,
        event_type: event.eventType,
        session_id: event.sessionId,
        click_x: event.clickX,
        click_y: event.clickY,
        viewport_w: event.viewportW,
        viewport_h: event.viewportH,
        scroll_depth: event.scrollDepth,
        created_at: createdAt,
      };
    });

    await getPrisma().analyticsHeatmapLog.createMany({
      data: rows,
      skipDuplicates: false,
    });

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to store heatmap events.' }, { status: 500 });
  }
}
