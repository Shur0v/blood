import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { boundedBody } from '@/src/backend/utils/boundedBody';
import { ClickEventSchema } from '@/src/lib/analytics';

export async function POST(req: Request) {
  try {
    const parsed = z.object({events:z.array(ClickEventSchema).min(1).max(100)}).safeParse(JSON.parse(new TextDecoder().decode(await boundedBody(req,256*1024))));
    if (!parsed.success) return NextResponse.json({success:false,message:'Invalid analytics payload.'},{status:400});
    const events = parsed.data.events;
    // Count and coordinates commit together. Unique keys make retries safe.
    await getPrisma().$transaction(async tx => {
      await tx.analyticsClickLog.createMany({data:events.map(event=>({event_key:event.eventId,page:event.page,component:event.component,device_type:event.deviceType})),skipDuplicates:true});
      const located = events.filter(event=>event.eventId);
      if (located.length) await tx.analyticsHeatmapLog.createMany({data:located.map(event=>({event_key:event.eventId,page:event.page,device_type:event.deviceType,event_type:'click',session_id:event.sessionId,
        click_x:event.clickX,click_y:event.clickY,viewport_w:event.viewportW,viewport_h:event.viewportH,document_w:event.documentW,document_h:event.documentH,coordinate_space:event.surface||'document',target_path:event.targetPath,target_x:event.targetX,target_y:event.targetY})),skipDuplicates:true});
    });
    return NextResponse.json({success:true,inserted:events.length},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({success:false,message:'Failed to store analytics events.'},{status:500});
  }
}
