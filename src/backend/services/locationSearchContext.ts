import { z } from 'zod';
import { explicitLocationCountry, locationCountry, withoutExplicitCountry } from '@/src/lib/locationCountry';
import { detectedVisitorLocation } from './automaticLocation';
import { getSessionFromRequest, USER_ROLE } from '../utils/session';
import { getPrisma } from '../config/db';

export type SearchBias = { lat: number; lng: number };
export type LocationSearchContext = {
  country: string; countryCode: string; text: string; bias?: SearchBias;
  city?: string; state?: string;
};
const browserPoint = z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180) });

export async function resolveLocationSearch(req: Request, text: string, accountCountry?: string): Promise<LocationSearchContext | null> {
  const params = new URL(req.url).searchParams;
  const explicit = explicitLocationCountry(text);
  const detected = await detectedVisitorLocation(req);
  let fallback = accountCountry;
  if (!explicit && !locationCountry(detected?.country) && !fallback) {
    const session = getSessionFromRequest(req);
    if (session?.role === USER_ROLE) fallback = (await getPrisma().user.findUnique({
      where: { id: session.user_id }, select: { location_country: true },
    }))?.location_country;
  }
  const country = explicit || locationCountry(detected?.country) || locationCountry(fallback) || locationCountry(params.get('country'));
  if (!country) return null;
  let bias: SearchBias | undefined;
  if (locationCountry(detected?.country)?.code === country.code && Number.isFinite(detected?.lat) && Number.isFinite(detected?.lng)) {
    bias = { lat: detected!.lat!, lng: detected!.lng! };
  }
  if (params.has('browserLat') && params.has('browserLng') && locationCountry(params.get('browserCountry'))?.code === country.code) {
    const point = browserPoint.safeParse({ lat: params.get('browserLat'), lng: params.get('browserLng') });
    if (point.success) bias = point.data;
  }
  return { country: country.name, countryCode: country.code, text: withoutExplicitCountry(text), bias };
}
