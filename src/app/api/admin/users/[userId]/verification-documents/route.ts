import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const CreateSchema = z.object({
  assetUrl: z.string().min(1),
  documentType: z.enum(['PRESCRIPTION', 'MEDICAL_REPORT', 'OTHER']).default('MEDICAL_REPORT'),
});

export async function POST(req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    const { userId } = await context.params;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const [document] = await prisma.$transaction([
      prisma.verificationDocument.create({
        data: {
          user_id: userId,
          document_type: parsed.data.documentType,
          asset_url: parsed.data.assetUrl,
          review_status: 'PENDING',
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { verification_status: 'PENDING' },
      }),
    ]);

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to submit verification document.' }, { status: 500 });
  }
}
