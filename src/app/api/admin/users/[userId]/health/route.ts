import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const HealthSchema = z.object({
  weight: z.number().optional(),
  weightUnknown: z.boolean().optional(),
  height: z.number().optional(),
  heightUnknown: z.boolean().optional(),
  hemoglobin: z.number().optional(),
  hemoglobinUnknown: z.boolean().optional(),
  isDiabetic: z.boolean().optional(),
  glucose: z.number().optional(),
  glucoseUnknown: z.boolean().optional(),
  vaccinations: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const parsed = HealthSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid health payload' }, { status: 400 });
  }

  const { userId } = await context.params;
  const prisma = getPrisma();
  const current = await prisma.user.findUnique({
    where: { id: userId },
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
    where: { id: userId },
    data: { health_data: mergedHealth as Prisma.InputJsonValue },
  });

  return NextResponse.json({ success: true, data: mergedHealth });
}
