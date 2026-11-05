import { assertLocationPolicy, lockLocationPolicy } from '@/src/backend/services/locationPolicy';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { RegistrationAreaSchema, verifyLocationProof } from '@/src/backend/utils/locationProof';
import { neighborhoodsEnabled } from '@/src/backend/services/neighborhoods';
import { sameLocationParent } from '@/src/lib/locationCountry';
import { medicalUser, MedicalError, medicalFailure } from '@/src/backend/utils/medicalPrivacy';
import { securityJson } from '@/src/backend/utils/security';
import { getPrisma } from '@/src/backend/config/db';
import { MAX_SERVICE_CITIES, lockPrimaryLocation, buildLockedUntil, listServiceCities, syncLegacyLocationFromFirstCity } from '@/src/backend/services/ServiceCityService';

const ServiceCitySchema = z.object({
  city: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  formatted_location: z.string().min(1).max(240),
  latitude: z.number(),
  longitude: z.number(),
  provider_place_id: z.string().min(1).max(240),
  token: z.string().min(1),
  registrationArea: RegistrationAreaSchema.optional(),
});

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

export async function GET(req: Request) {
  const auth = ensureUserSession(req);
  if ('error' in auth) return auth.error;
  try { medicalUser(req); } catch (error) { return medicalFailure(error); }

  const data = await listServiceCities(auth.session.user_id);
  return NextResponse.json({ success: true, data, meta: { maxCities: MAX_SERVICE_CITIES } });
}

export async function POST(req: Request) {
  const auth = ensureUserSession(req);
  if ('error' in auth) return auth.error;

  try { medicalUser(req); } catch (error) { return medicalFailure(error); }
  let input: unknown;
  try { input = await securityJson(req, 8192); } catch (error) { return medicalFailure(error); }
  const parsed = ServiceCitySchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid city payload.' }, { status: 400 });
  }

  const payload = parsed.data;
  const proof = verifyLocationProof(payload.token);
  if (!proof) {
    return NextResponse.json({ success: false, message: 'Invalid location proof token.' }, { status: 400 });
  }

  try { await assertLocationPolicy(req, proof); } catch (error) { return medicalFailure(error); }
  const matches =
    proof.city === payload.city &&
    proof.country === payload.country &&
    proof.formatted_location === payload.formatted_location &&
    proof.latitude === payload.latitude &&
    proof.longitude === payload.longitude &&
    proof.provider_place_id === payload.provider_place_id &&
    proof.registrationArea?.name === payload.registrationArea?.name &&
    proof.registrationArea?.placeId === payload.registrationArea?.placeId &&
    (!payload.registrationArea || await neighborhoodsEnabled());

  if (!matches) {
    return NextResponse.json({ success: false, message: 'Location mismatch detected.' }, { status: 400 });
  }

  const prisma = getPrisma();
  try {
    await prisma.$transaction(async tx => {
      await lockLocationPolicy(tx, req, proof);
      await lockPrimaryLocation(tx, auth.session.user_id);
      const existing = await tx.userServiceCity.findMany({ where: { user_id: auth.session.user_id } });
      if (existing.some(row => sameLocationParent(row, payload))) {
        throw new MedicalError('This city is already listed. Choose Update neighborhood to change its area.', 409);
      }
      const existingCount = await tx.userServiceCity.count({ where: { user_id: auth.session.user_id } });
      if (existingCount >= MAX_SERVICE_CITIES) throw new Error('CITY_LIMIT');
      await tx.userServiceCity.create({ data: {
        user_id: auth.session.user_id, city: payload.city, country: payload.country,
        formatted_location: payload.formatted_location, lat: payload.latitude, lng: payload.longitude,
        provider_place_id: payload.provider_place_id, locked_until: buildLockedUntil(),
        neighborhood_name: payload.registrationArea?.name,
        neighborhood_place_id: payload.registrationArea?.placeId,
      } });
      await syncLegacyLocationFromFirstCity(auth.session.user_id, tx, existingCount === 0);
    });
  } catch (error) {
    if (error instanceof MedicalError) return medicalFailure(error);
    const limitReached = error instanceof Error && error.message === 'CITY_LIMIT';
    return NextResponse.json({ success: false, message: limitReached
      ? `Maximum ${MAX_SERVICE_CITIES} cities allowed per account.` : 'City already exists for this account.' }, { status: limitReached ? 400 : 409 });
  }
  const data = await listServiceCities(auth.session.user_id);
  return NextResponse.json({ success: true, data, meta: { maxCities: MAX_SERVICE_CITIES } });
}
