import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';

const HealthSchema = z.object({
  weight: z.number().nullable().optional(),
  weightUnknown: z.boolean().optional(),
  height: z.number().nullable().optional(),
  heightUnknown: z.boolean().optional(),
  hemoglobin: z.number().nullable().optional(),
  hemoglobinUnknown: z.boolean().optional(),
  isDiabetic: z.boolean().optional(),
  glucose: z.number().nullable().optional(),
  glucoseUnknown: z.boolean().optional(),
  vaccinations: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number]) || session.role !== USER_ROLE) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const parsed = HealthSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid health payload' }, { status: 400 });
  }

  const prisma = getPrisma();
  const current = await prisma.user.findUnique({
    where: { id: session.user_id },
    select: { health_data: true },
  });

  if (!current) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const existingHealth =
    current.health_data && typeof current.health_data === 'object' && !Array.isArray(current.health_data)
      ? (current.health_data as Record<string, unknown>)
      : {};

  const mergedHealth = {
    ...existingHealth,
    ...parsed.data,
  };

  await prisma.user.update({
    where: { id: session.user_id },
    data: { health_data: mergedHealth as Prisma.InputJsonValue },
  });

  return NextResponse.json({ success: true, data: mergedHealth });
}
