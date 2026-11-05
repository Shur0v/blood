import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { medicalUser, MedicalError, medicalFailure, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { securityJson, securityRateLimit } from '@/src/backend/utils/security';
import { signLocationProof, verifyLocationProof } from '@/src/backend/utils/locationProof';
import { lookupNeighborhoods, neighborhoodsEnabled, normalizeLocation } from '@/src/backend/services/neighborhoods';
import { lockPrimaryLocation } from '@/src/backend/services/ServiceCityService';
import { explicitLocationCountry, locationCountry, sameLocationParent, withoutExplicitCountry } from '@/src/lib/locationCountry';
import { resolveLocationSearch } from '@/src/backend/services/locationSearchContext';

const Selection = z.union([
  z.object({ clear: z.literal(true) }).strict(),
  z.object({ token: z.string().min(1).max(4096) }).strict(),
]);
const accountLocation = (user: { location_city: string; location_country: string; registration_area: string | null }) => ({
  city: user.location_city, country: user.location_country, neighborhood: user.registration_area,
});

export async function GET(req: Request) {
  try {
    const userId = medicalUser(req);
    const user = await getPrisma().user.findUnique({ where: { id: userId } });
    if (!user) throw new MedicalError('Account no longer available.', 404);
    const text = new URL(req.url).searchParams.get('text');
    let suggestions: unknown[] = [];
    if (text !== null && neighborhoodsEnabled()) {
      const query = z.string().trim().min(3).max(120).safeParse(text);
      if (!query.success) throw new MedicalError('Enter 3–120 characters.', 400);
      await securityRateLimit('neighborhood-lookup', userId, 60, 60000);
      const search = await resolveLocationSearch(req, query.data, user.location_country);
      const foreign = explicitLocationCountry(query.data);
      const rows = foreign && foreign.code !== locationCountry(user.location_country)?.code ? [] : await lookupNeighborhoods(withoutExplicitCountry(query.data), {
        city: user.location_city, country: user.location_country,
        bias: search?.countryCode === locationCountry(user.location_country)?.code ? search.bias : undefined,
      });
      suggestions = rows.filter(row => row.registrationArea && sameLocationParent({ city: user.location_city, country: user.location_country, provider_place_id: user.place_id }, row))
        .map(row => ({ ...row, token: signLocationProof(row) }));
    }
    return NextResponse.json({ success: true, data: { ...accountLocation(user), enabled: neighborhoodsEnabled(), suggestions } }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}

export async function PATCH(req: Request) {
  try {
    const userId = medicalUser(req);
    if (!neighborhoodsEnabled()) throw new MedicalError('Neighborhood editing is currently disabled.', 409);
    const parsed = Selection.safeParse(await securityJson(req, 8192));
    if (!parsed.success) throw new MedicalError('Choose a neighborhood or clear the saved selection.', 400);
    await securityRateLimit('neighborhood-save', userId, 20, 60000);
    const input = parsed.data;
    const proof = 'token' in input ? verifyLocationProof(input.token) : null;
    if ('token' in input && !proof?.registrationArea) throw new MedicalError('Selection expired or invalid. Search again.', 400);
    const user = await getPrisma().$transaction(async tx => {
      const current = await lockPrimaryLocation(tx, userId);
      if (proof && !sameLocationParent({ city: current.location_city, country: current.location_country, provider_place_id: current.place_id }, proof)) {
        throw new MedicalError('Your primary city changed. Reload your profile and choose again.', 409);
      }
      const primary = await tx.userServiceCity.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'asc' } });
      if (primary && normalizeLocation(primary.city) === normalizeLocation(current.location_city) && normalizeLocation(primary.country) === normalizeLocation(current.location_country)) {
        await tx.userServiceCity.update({ where: { id: primary.id }, data: {
          neighborhood_name: proof?.registrationArea?.name ?? null,
          neighborhood_place_id: proof?.registrationArea?.placeId ?? null,
        } });
      }
      return tx.user.update({ where: { id: userId }, data: {
        registration_area: proof?.registrationArea?.name ?? null,
        registration_area_place_id: proof?.registrationArea?.placeId ?? null,
      } });
    });
    return NextResponse.json({ success: true, data: accountLocation(user) }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
