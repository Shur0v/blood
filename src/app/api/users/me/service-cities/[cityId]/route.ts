import { NextResponse } from 'next/server';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { getPrisma } from '@/src/backend/config/db';
import { listServiceCities, syncLegacyLocationFromFirstCity } from '@/src/backend/services/ServiceCityService';

const ensureUserSession = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) {
    return { error: NextResponse.json({ success: false, message: 'Forbidden for admin session' }, { status: 403 }) };
  }

  if (session.role !== USER_ROLE) {
    return { error: NextResponse.json({ success: false, message: 'Invalid session role' }, { status: 403 }) };
  }

  return { session };
};

export async function DELETE(req: Request, { params }: { params: Promise<{ cityId: string }> }) {
  const auth = ensureUserSession(req);
  if ('error' in auth) return auth.error;

  const resolved = await params;
  const cityId = resolved.cityId;
  if (!cityId) {
    return NextResponse.json({ success: false, message: 'City id is required.' }, { status: 400 });
  }

  const prisma = getPrisma();
  const row = await prisma.userServiceCity.findFirst({
    where: {
      id: cityId,
      user_id: auth.session.user_id,
    },
  });

  if (!row) {
    return NextResponse.json({ success: false, message: 'City not found.' }, { status: 404 });
  }

  if (row.locked_until.getTime() > Date.now()) {
    const msLeft = row.locked_until.getTime() - Date.now();
    const remainingDays = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    return NextResponse.json(
      {
        success: false,
        message: `City is locked. You can remove city after ${remainingDays} day(s).`,
        meta: { remainingDays },
      },
      { status: 409 },
    );
  }

  await prisma.userServiceCity.delete({
    where: { id: cityId },
  });

  await syncLegacyLocationFromFirstCity(auth.session.user_id);
  const data = await listServiceCities(auth.session.user_id);
  return NextResponse.json({ success: true, data });
}
