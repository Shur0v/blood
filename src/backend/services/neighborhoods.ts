import { z } from 'zod';
import type { LocationSelectionPayload } from '../utils/locationProof';

export const neighborhoodsEnabled = () =>
  (process.env.NEIGHBORHOODS_ENABLED ?? process.env.SIGNUP_NEIGHBORHOODS_ENABLED) === 'true';
export const normalizeLocation = (value: string) => value.normalize('NFKC').toLocaleLowerCase('en')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
export type NeighborhoodContext = { city: string; country: string; state?: string };
export type NeighborhoodSelection = LocationSelectionPayload & { state?: string };

// Reviewed areas retain the existing Dhaka city fallback reference and city coordinates.
const dhaka: NeighborhoodSelection = {
  city: 'Dhaka', country: 'Bangladesh', formatted_location: 'Dhaka, Bangladesh',
  latitude: 23.8103, longitude: 90.4125, provider_place_id: 'fallback-dhaka-bangladesh',
};
const reviewedAreas = ['South Badda', 'West Rampura', 'Banasree', 'Gulshan', 'Mohakhali'].map(name => ({
  ...dhaka, registrationArea: { name, placeId: 'bloodnet:bd:dhaka:' + normalizeLocation(name).replaceAll(' ', '-') },
}));
const PlaceSchema = z.object({
  city: z.string().trim().min(1).max(120), country: z.string().trim().min(1).max(120),
  country_code: z.string().regex(/^[a-z]{2}$/i), place_id: z.string().min(1).max(256),
  result_type: z.string(), state: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180),
  name: z.string().max(120).optional(), address_line1: z.string().max(300).optional(),
  suburb: z.string().max(120).optional(), district: z.string().max(120).optional(),
  neighbourhood: z.string().max(120).optional(), street: z.string().optional(), housenumber: z.string().optional(),
});
type Place = z.infer<typeof PlaceSchema>;
const citySelection = (place: Place): NeighborhoodSelection => ({
  city: place.city, country: place.country, state: place.state,
  formatted_location: `${place.city}, ${place.country}`, latitude: place.lat,
  longitude: place.lon, provider_place_id: place.place_id,
});
const sameContext = (place: NeighborhoodContext, context?: NeighborhoodContext) => !context ||
  (normalizeLocation(place.city) === normalizeLocation(context.city) &&
   normalizeLocation(place.country) === normalizeLocation(context.country) &&
   (!context.state || normalizeLocation(place.state || '') === normalizeLocation(context.state)));

export function matchesLocationQuery(place: NeighborhoodSelection, query: string): boolean {
  const words = normalizeLocation([place.registrationArea?.name, place.city, place.state, place.country].filter(Boolean).join(' ')).split(' ');
  const parts = query.split(',').map(normalizeLocation).filter(Boolean);
  if (parts.length >= 2 && !normalizeLocation(place.city).startsWith(parts[1])) return false;
  if (parts.length >= 3 && !normalizeLocation(place.country).startsWith(parts[2])) return false;
  return normalizeLocation(query).split(' ').every(word => words.some(part => part.startsWith(word)));
}
function relevance(place: NeighborhoodSelection, query: string) {
  const area = normalizeLocation(place.registrationArea?.name || '');
  const text = normalizeLocation(query);
  if (area && text === area) return 0;
  if (area && text.startsWith(area + ' ')) return 1;
  return area ? 2 : 3;
}
const cache = new Map<string, { expires: number; data: NeighborhoodSelection[] }>();
const pending = new Map<string, Promise<NeighborhoodSelection[]>>();

async function providerLookup(text: string, apiKey: string, cityOnly = false, countryCode?: string): Promise<Place[]> {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.search = new URLSearchParams({ text, apiKey, format: 'json', limit: '8', lang: 'en' }).toString();
  if (cityOnly) url.searchParams.set('type', 'city');
  if (countryCode) url.searchParams.set('filter', 'countrycode:' + countryCode.toLowerCase());
  const response = await fetch(url, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data?.results)) return [];
  return data.results.slice(0, 8).flatMap((row: unknown) => {
    const parsed = PlaceSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

async function verifiedProviderSelections(text: string, apiKey: string): Promise<NeighborhoodSelection[]> {
  const places = await providerLookup(text, apiKey);
  const output: NeighborhoodSelection[] = places.filter(place => place.result_type === 'city').map(citySelection);
  const parents = new Map<string, Promise<Place | undefined>>();
  await Promise.all(places.map(async place => {
    if (!['suburb', 'district', 'neighbourhood', 'city_district', 'subdistrict'].includes(place.result_type) || place.street || place.housenumber) return;
    const name = place.neighbourhood || (place.result_type === 'suburb' ? place.suburb : place.district) || place.name || place.address_line1;
    if (!name || name.length > 120 || normalizeLocation(name) === normalizeLocation(place.city)) return;
    const parentKey = [place.country_code, place.state || '', place.city].map(normalizeLocation).join('|');
    let parent = parents.get(parentKey);
    if (!parent) {
      if (parents.size >= 3) return;
      parent = providerLookup([place.city, place.state, place.country].filter(Boolean).join(', '), apiKey, true, place.country_code)
        .then(rows => {
          const matches = new Map(rows.filter(row => row.result_type === 'city' &&
            normalizeLocation(row.city) === normalizeLocation(place.city) && row.country_code.toLowerCase() === place.country_code.toLowerCase() &&
            (!place.state || normalizeLocation(row.state || '') === normalizeLocation(place.state))).map(row => [row.place_id, row]));
          return matches.size === 1 ? matches.values().next().value : undefined;
        }).catch(() => undefined);
      parents.set(parentKey, parent);
    }
    const city = await parent;
    if (city) {
      output.push({ ...citySelection(city), registrationArea: { name, placeId: place.place_id } });
      output.push(citySelection(city));
    }
  }));
  return output;
}

export async function lookupNeighborhoods(text: string, context?: NeighborhoodContext): Promise<NeighborhoodSelection[]> {
  const reviewed = reviewedAreas.filter(place => sameContext(place, context) && matchesLocationQuery(place, text));
  const apiKey = process.env.GEOAPIFY_API_KEY;
  const cacheKey = JSON.stringify([text, context, apiKey]);
  let provider: NeighborhoodSelection[] = [];
  if (apiKey) {
    const saved = cache.get(cacheKey);
    if (saved && saved.expires > Date.now()) provider = saved.data;
    else {
      let lookup = pending.get(cacheKey);
      if (!lookup && pending.size < 32) {
        lookup = verifiedProviderSelections(context ? `${text}, ${context.city}, ${context.country}` : text, apiKey);
        pending.set(cacheKey, lookup);
      }
      try {
        provider = await lookup || [];
        if (provider.length && process.env.NODE_ENV !== 'test') {
          if (cache.size >= 256) cache.delete(cache.keys().next().value!);
          cache.set(cacheKey, { expires: Date.now() + 300000, data: provider });
        }
      } catch { /* Reviewed entries remain available during provider outages. */ }
      finally { pending.delete(cacheKey); }
    }
  }
  const supplemental = reviewed.filter(area => !provider.some(place =>
    sameContext(place, area) && normalizeLocation(place.registrationArea?.name || '') === normalizeLocation(area.registrationArea.name)));
  const matching = [...provider, ...supplemental].filter(place => sameContext(place, context) && matchesLocationQuery(place, text));
  const unique = new Map<string, NeighborhoodSelection>();
  for (const place of matching) {
    const key = [place.country, place.state || '', place.city, place.registrationArea?.name || ''].map(normalizeLocation).join('|');
    if (!unique.has(key)) unique.set(key, place);
  }
  for (const place of [...unique.values()]) if (place.registrationArea) {
    const { registrationArea, ...city } = place;
    const key = [city.country, city.state || '', city.city, ''].map(normalizeLocation).join('|');
    if (!unique.has(key)) unique.set(key, city);
  }
  return [...unique.values()].sort((a, b) => relevance(a, text) - relevance(b, text) ||
    (a.registrationArea?.name || a.city).localeCompare(b.registrationArea?.name || b.city)).slice(0, 12);
}
