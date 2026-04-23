import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { normalizeOrganList } from '@/src/lib/organCatalog';

const OrgansSchema = z.object({
  organs: z.array(z.string().min(1)).max(20),
});

export async function PATCH(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number]) || session.role !== USER_ROLE) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const parsed = OrgansSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid organs payload' }, { status: 400 });
  }

  const normalizedOrgans = normalizeOrganList(parsed.data.organs);
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    await tx.organPledge.deleteMany({
      where: { user_id: session.user_id },
    });

    if (normalizedOrgans.length > 0) {
      await tx.organPledge.createMany({
        data: normalizedOrgans.map((organ) => ({
          user_id: session.user_id,
          organ_type: organ,
          is_active: true,
        })),
      });
    }
  });

  return NextResponse.json({
    success: true,
    data: { organs: normalizedOrgans },
  });
}
