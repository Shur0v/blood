import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';

const CreateSchema = z.object({
  assetUrl: z.string().min(1),
  documentType: z.enum(['PRESCRIPTION', 'MEDICAL_REPORT', 'OTHER']).default('MEDICAL_REPORT'),
});

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== USER_ROLE) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    const prisma = getPrisma();
    const [document] = await prisma.$transaction([
      prisma.verificationDocument.create({
        data: {
          user_id: session.user_id,
          document_type: parsed.data.documentType,
          asset_url: parsed.data.assetUrl,
          review_status: 'PENDING',
        },
      }),
      prisma.user.update({
        where: { id: session.user_id },
        data: { verification_status: 'PENDING' },
      }),
    ]);

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to submit verification document.' }, { status: 500 });
  }
}
