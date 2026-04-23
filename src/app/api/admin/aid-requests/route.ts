import { NextResponse } from "next/server";
import { z } from 'zod';
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const UpdateRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});
const DeleteRequestSchema = z.object({
  id: z.string().uuid(),
});

const ensureAdminSession = (req: Request): NextResponse | null => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  return null;
};

export async function GET(req: Request) {
  const authError = ensureAdminSession(req);
  if (authError) {
    return authError;
  }

  try {
    const requests = await getPrisma().medicalAidRequest.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch medical aid requests." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authError = ensureAdminSession(req);
  if (authError) {
    return authError;
  }

  try {
    const parsed = UpdateRequestSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing request ID or status." }, { status: 400 });
    }

    const { id, status } = parsed.data;

    const updatedRequest = await getPrisma().medicalAidRequest.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: updatedRequest, message: `Request successfully marked as ${status}.` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to update request status." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authError = ensureAdminSession(req);
  if (authError) {
    return authError;
  }

  try {
    const parsed = DeleteRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing request ID." }, { status: 400 });
    }

    const { id } = parsed.data;

    await getPrisma().medicalAidRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Request deleted successfully." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to delete request." }, { status: 500 });
  }
}
