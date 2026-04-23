import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';

const CreateReportSchema = z.object({
  type: z.enum(['Scam Report', 'Suggestion', 'Other']),
  subject: z.string().min(1).max(180),
  details: z.string().min(1).max(5000),
  contact: z.string().max(120).optional(),
});

const mapTypeToTarget = (type: 'Scam Report' | 'Suggestion' | 'Other') => {
  if (type === 'Scam Report') return 'USER';
  if (type === 'Suggestion') return 'PLATFORM';
  return 'GENERAL';
};

export async function POST(req: Request) {
  try {
    const parsed = CreateReportSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid report payload.' }, { status: 400 });
    }

    const created = await getPrisma().report.create({
      data: {
        target_type: mapTypeToTarget(parsed.data.type),
        target_id: parsed.data.subject,
        message: parsed.data.details,
        reporter_contact: parsed.data.contact || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to submit report.' }, { status: 500 });
  }
}
