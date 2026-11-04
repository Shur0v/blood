import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RegistrationAreaSchema, signLocationProof, type LocationSelectionPayload } from '@/src/backend/utils/locationProof';
import { GET as lookupCities } from '../cities/route';

const Query = z.string().trim().min(2).max(120);
const Place = z.object({
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  country_code: z.string().regex(/^[a-z]{2}$/i),
  place_id: z.string().min(1).max(256),
  result_type: z.string(),
  state: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  formatted: z.string().trim().max(300).optional(),
  name: z.string().optional(),
  address_line1: z.string().optional(),
  suburb: z.string().optional(),
  district: z.string().optional(),
  neighbourhood: z.string().optional(),
  street: z.string().optional(),
  housenumber: z.string().optional(),
});
type Place = z.infer<typeof Place>;
const key = (text: string) => text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const cityPayload = (place: Place): LocationSelectionPayload => ({
  city: place.city,
  country: place.country,
  formatted_location: place.formatted || `${place.city}, ${place.country}`,
  latitude: place.lat,
  longitude: place.lon,
  provider_place_id: place.place_id,
});

async function lookup(text: string, apiKey: string, countryCode?: string): Promise<Place[]> {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.search = new URLSearchParams({ text, apiKey, format: 'json', limit: '8' }).toString();
  if (countryCode) {
    url.searchParams.set('type', 'city');
    url.searchParams.set('filter', 'countrycode:' + countryCode.toLowerCase());
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data?.results)) return [];
  return data.results.slice(0, 8).flatMap((row: unknown) => {
    const parsed = Place.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function GET(req: Request) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || process.env.SIGNUP_NEIGHBORHOODS_ENABLED !== 'true') return lookupCities(req);
  const query = Query.safeParse(new URL(req.url).searchParams.get('text'));
  if (!query.success) return NextResponse.json({ success: false, message: 'Enter a city or neighborhood name (2–120 characters).' }, { status: 400 });

  try {
    const places = await lookup(query.data, apiKey);
    const suggestions = new Map<string, LocationSelectionPayload>();
    const parents = new Map<string, Promise<Place | undefined>>();
    const addCity = (place: Place) => suggestions.set(place.place_id, cityPayload(place));
    for (const place of places) if (place.result_type === 'city') addCity(place);

    const areas = await Promise.all(places.flatMap(place => {
      if (!['suburb', 'district', 'neighbourhood', 'city_district', 'subdistrict'].includes(place.result_type) || place.street || place.housenumber) return [];
      const area = RegistrationAreaSchema.safeParse({
        name: place.address_line1 || place.name || place.neighbourhood || (place.result_type === 'suburb' ? place.suburb : place.district),
        placeId: place.place_id,
      });
      if (!area.success || key(area.data.name) === key(place.city)) return [];

      const parentKey = [place.country_code, place.state || '', place.city].map(key).join('\0');
      let parent = parents.get(parentKey);
      if (!parent) {
        if (parents.size >= 3) return [];
        parent = lookup([place.city, place.state, place.country].filter(Boolean).join(', '), apiKey, place.country_code)
          .then(rows => {
            const matches = new Map(rows.filter(row => row.result_type === 'city' &&
              key(row.city) === key(place.city) && key(row.country_code) === key(place.country_code) &&
              (!place.state || key(row.state || '') === key(place.state))).map(row => [row.place_id, row]));
            return matches.size === 1 ? matches.values().next().value : undefined;
          }).catch(() => undefined);
        parents.set(parentKey, parent);
      }
      return [parent.then(city => city && ({ city, area: area.data }))];
    }));

    for (const entry of areas) {
      if (!entry) continue;
      suggestions.set('area:' + entry.area.placeId, { ...cityPayload(entry.city), registrationArea: entry.area });
      addCity(entry.city);
    }
    if (!suggestions.size) return lookupCities(req);
    const ordered = [...suggestions.values()].sort((a, b) => Number(Boolean(b.registrationArea)) - Number(Boolean(a.registrationArea)));
    return NextResponse.json({ success: true, data: ordered.slice(0, 12).map(payload => ({ ...payload, token: signLocationProof(payload) })) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return lookupCities(req);
  }
}
