import { NextResponse } from "next/server";
import { z } from 'zod';
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const StatsSchema = z
  .object({
    total_raised: z.coerce.number().min(0),
    total_spent: z.coerce.number().min(0),
    completed_ops: z.coerce.number().int().min(0),
    uncompleted_ops: z.coerce.number().int().min(0),
    weekly_donors: z.coerce.number().int().min(0),
    donor_requests: z.coerce.number().int().min(0).optional(),
    donorRequests: z.coerce.number().int().min(0).optional(),
  })
  .transform((data) => ({
    ...data,
    donor_requests: data.donor_requests ?? data.donorRequests ?? 0,
  }));

export async function PUT(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const parsed = StatsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid platform stats payload.' }, { status: 400 });
    }

    const { total_raised, total_spent, completed_ops, uncompleted_ops, weekly_donors, donor_requests } = parsed.data;

    let stats = await prisma.platformSettings.findFirst();

    if (stats) {
      stats = await prisma.platformSettings.update({
        where: { id: stats.id },
        data: {
          total_raised,
          total_spent,
          completed_ops,
          uncompleted_ops,
          weekly_donors,
          donor_requests,
        }
      });
    } else {
      stats = await prisma.platformSettings.create({
        data: {
          total_raised,
          total_spent,
          completed_ops,
          uncompleted_ops,
          weekly_donors,
          donor_requests,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: stats,
      message: "Platform Statistics Successfully Synchronized.",
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to update platform statistics." }, { status: 500 });
  }
}
