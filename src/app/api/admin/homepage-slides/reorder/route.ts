import {reorderHomepageSlides} from '@/src/backend/services/homepageSlides';
import {securityJson} from '@/src/backend/utils/security';
import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const ReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

const ensureAdmin = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const };
};

async function handlePUT(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = ReorderSchema.safeParse(await securityJson(req));
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid reorder payload.' }, { status: 400 });
    }

    const orderedIds = parsed.data.orderedIds;
    await reorderHomepageSlides(orderedIds);

    return NextResponse.json({ success: true, message: 'Slide order updated.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update slide order.' }, { status: 500 });
  }
}


export const PUT = withActiveAdmin(handlePUT);
