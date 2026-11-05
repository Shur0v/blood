import { NextResponse } from 'next/server';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { getPrisma } from '@/src/backend/config/db';
import { lockPrimaryLocation, listServiceCities, syncLegacyLocationFromFirstCity } from '@/src/backend/services/ServiceCityService';
import { medicalUser, MedicalError, medicalFailure, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { securityJson, securityRateLimit } from '@/src/backend/utils/security';
import { verifyLocationProof } from '@/src/backend/utils/locationProof';
import { neighborhoodsEnabled } from '@/src/backend/services/neighborhoods';
import { sameLocationParent } from '@/src/lib/locationCountry';
import { z } from 'zod';

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
  try { medicalUser(req); } catch (error) { return medicalFailure(error); }

  const resolved = await params;
  const cityId = resolved.cityId;
  if (!cityId) {
    return NextResponse.json({ success: false, message: 'City id is required.' }, { status: 400 });
  }

  const prisma = getPrisma();
  return prisma.$transaction(async tx => {
    await lockPrimaryLocation(tx, auth.session.user_id);
    const primary = await tx.userServiceCity.findFirst({ where: { user_id: auth.session.user_id }, orderBy: { created_at: 'asc' } });
    const row = await tx.userServiceCity.findFirst({
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

    await tx.userServiceCity.delete({
      where: { id: cityId },
    });

    await syncLegacyLocationFromFirstCity(auth.session.user_id, tx, primary?.id === cityId);
    const data = await listServiceCities(auth.session.user_id, tx);
    return NextResponse.json({ success: true, data });
  });
}

const AreaUpdate = z.union([
  z.object({ token: z.string().min(1).max(4096) }).strict(),
  z.object({ clear: z.literal(true) }).strict(),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ cityId: string }> }) {
  try {
    const userId = medicalUser(req);
    if (!neighborhoodsEnabled()) throw new MedicalError('Neighborhood editing is currently disabled.', 409);
    const input = AreaUpdate.safeParse(await securityJson(req, 8192));
    if (!input.success) throw new MedicalError('Choose a neighborhood or clear the current area.', 400);
    const proof = 'token' in input.data ? verifyLocationProof(input.data.token) : null;
    if ('token' in input.data && !proof?.registrationArea) throw new MedicalError('Selection expired or invalid. Search again.', 400);
    await securityRateLimit('service-neighborhood-save', userId, 20, 60000);
    const { cityId } = await params;
    const data = await getPrisma().$transaction(async tx => {
      await lockPrimaryLocation(tx, userId);
      const row = await tx.userServiceCity.findFirst({ where: { id: cityId, user_id: userId } });
      if (!row) throw new MedicalError('Service city no longer available. Reload your profile.', 404);
      if (proof && !sameLocationParent(row, proof)) {
        throw new MedicalError('Choose an area within this service city.', 409);
      }
      await tx.userServiceCity.update({ where: { id: row.id }, data: {
        neighborhood_name: proof?.registrationArea?.name ?? null,
        neighborhood_place_id: proof?.registrationArea?.placeId ?? null,
      } });
      const primary = await tx.userServiceCity.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
      if (primary?.id === row.id) await syncLegacyLocationFromFirstCity(userId, tx, true);
      return listServiceCities(userId, tx);
    });
    return NextResponse.json({ success: true, data }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
