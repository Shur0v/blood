import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { verifyLocationProof } from '@/src/backend/utils/locationProof';
import { getPrisma } from '@/src/backend/config/db';
import { MAX_SERVICE_CITIES, buildLockedUntil, listServiceCities, syncLegacyLocationFromFirstCity } from '@/src/backend/services/ServiceCityService';

const ServiceCitySchema = z.object({
  city: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  formatted_location: z.string().min(1).max(240),
  latitude: z.number(),
  longitude: z.number(),
  provider_place_id: z.string().min(1).max(240),
  token: z.string().min(1),
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

  const data = await listServiceCities(auth.session.user_id);
  return NextResponse.json({ success: true, data, meta: { maxCities: MAX_SERVICE_CITIES } });
}

export async function POST(req: Request) {
  const auth = ensureUserSession(req);
  if ('error' in auth) return auth.error;

  const parsed = ServiceCitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid city payload.' }, { status: 400 });
  }

  const payload = parsed.data;
  const proof = verifyLocationProof(payload.token);
  if (!proof) {
    return NextResponse.json({ success: false, message: 'Invalid location proof token.' }, { status: 400 });
  }

  const matches =
    proof.city === payload.city &&
    proof.country === payload.country &&
    proof.formatted_location === payload.formatted_location &&
    proof.latitude === payload.latitude &&
    proof.longitude === payload.longitude &&
    proof.provider_place_id === payload.provider_place_id;

  if (!matches) {
    return NextResponse.json({ success: false, message: 'Location mismatch detected.' }, { status: 400 });
  }

  const prisma = getPrisma();
  const existingCount = await prisma.userServiceCity.count({
    where: { user_id: auth.session.user_id },
  });

  if (existingCount >= MAX_SERVICE_CITIES) {
    return NextResponse.json(
      { success: false, message: `Maximum ${MAX_SERVICE_CITIES} cities allowed per account.` },
      { status: 400 },
    );
  }

  try {
    await prisma.userServiceCity.create({
      data: {
        user_id: auth.session.user_id,
        city: payload.city,
        country: payload.country,
        formatted_location: payload.formatted_location,
        lat: payload.latitude,
        lng: payload.longitude,
        provider_place_id: payload.provider_place_id,
        locked_until: buildLockedUntil(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'City already exists for this account.' }, { status: 409 });
  }

  await syncLegacyLocationFromFirstCity(auth.session.user_id);
  const data = await listServiceCities(auth.session.user_id);
  return NextResponse.json({ success: true, data, meta: { maxCities: MAX_SERVICE_CITIES } });
}
