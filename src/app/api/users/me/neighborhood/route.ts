import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { medicalUser, MedicalError, medicalFailure, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { securityJson, securityRateLimit } from '@/src/backend/utils/security';
import { signLocationProof, verifyLocationProof } from '@/src/backend/utils/locationProof';
import { lookupNeighborhoods, neighborhoodsEnabled, normalizeLocation } from '@/src/backend/services/neighborhoods';
import { lockPrimaryLocation } from '@/src/backend/services/ServiceCityService';

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
      const query = z.string().trim().min(2).max(120).safeParse(text);
      if (!query.success) throw new MedicalError('Enter 2–120 characters.', 400);
      await securityRateLimit('neighborhood-lookup', userId, 60, 60000);
      const rows = await lookupNeighborhoods(query.data, { city: user.location_city, country: user.location_country });
      suggestions = rows.filter(row => row.registrationArea).map(row => ({ ...row, token: signLocationProof(row) }));
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
      if (proof && (normalizeLocation(proof.city) !== normalizeLocation(current.location_city) ||
          normalizeLocation(proof.country) !== normalizeLocation(current.location_country))) {
        throw new MedicalError('Your primary city changed. Reload your profile and choose again.', 409);
      }
      return tx.user.update({ where: { id: userId }, data: {
        registration_area: proof?.registrationArea?.name ?? null,
        registration_area_place_id: proof?.registrationArea?.placeId ?? null,
      } });
    });
    return NextResponse.json({ success: true, data: accountLocation(user) }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
