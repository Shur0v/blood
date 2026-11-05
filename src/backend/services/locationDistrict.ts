import { createHash } from 'node:crypto';
import { normalizeLocationText, locationCountry } from '@/src/lib/locationCountry';
import { detectedVisitorLocation } from './automaticLocation';
import { getClientIp } from '../utils/risk';

export type DistrictIdentity = { key: string; name: string; country: string; state?: string };
export function districtIdentity(place: {
  country_code?: string;
  country?: string;
  state?: string;
  county?: string;
  state_district?: string;
}): DistrictIdentity | undefined {
  const country = locationCountry(place.country_code || place.country);
  const name = place.state_district || place.county;
  if (!country || !name) return undefined;
  return {
    key: [country.code, place.state || '', name].map(normalizeLocationText).join('|'),
    name,
    country: country.name,
    state: place.state,
  };
}

export function locationVisitorKey(req: Request) {
  return createHash('sha256').update(getClientIp(req)).digest('hex');
}

const cache = new Map<string, { expires: number; district?: DistrictIdentity }>();
export async function detectLocationDistrict(req: Request): Promise<DistrictIdentity | undefined> {
  const params = new URL(req.url).searchParams;
  let point: { lat: number; lng: number } | undefined;
  if (params.has('browserLat') && params.has('browserLng')) {
    const lat = Number(params.get('browserLat')),
      lng = Number(params.get('browserLng'));
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)
      point = { lat, lng };
  }
  if (!point) {
    const detected = await detectedVisitorLocation(req);
    if (Number.isFinite(detected?.lat) && Number.isFinite(detected?.lng))
      point = { lat: detected!.lat!, lng: detected!.lng! };
  }
  const key = process.env.GEOAPIFY_API_KEY;
  if (!point || !key) return undefined;
  const cacheKey = `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
  const saved = cache.get(cacheKey);
  if (saved && saved.expires > Date.now()) return saved.district;
  const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
  url.search = new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lng),
    format: 'json',
    lang: 'en',
    apiKey: key,
  }).toString();
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!response.ok) return undefined;
    const body = await response.json();
    const district = districtIdentity(body.results?.[0] || body.features?.[0]?.properties || {});
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { expires: Date.now() + 60000, district });
    return district;
  } catch {
    return undefined;
  }
}
