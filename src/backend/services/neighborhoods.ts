import { z } from 'zod';
import type { LocationSelectionPayload } from '../utils/locationProof';
import { explicitLocationCountry, locationCountry, normalizeLocationText, withoutExplicitCountry } from '@/src/lib/locationCountry';
import type { SearchBias } from './locationSearchContext';
import { FALLBACK_CITY_DATA } from '../data/locationFallbacks';

export const neighborhoodsEnabled = () =>
  (process.env.NEIGHBORHOODS_ENABLED ?? process.env.SIGNUP_NEIGHBORHOODS_ENABLED) === 'true';
export const normalizeLocation = normalizeLocationText;
export type NeighborhoodContext = { city?: string; country?: string; state?: string; countryCode?: string; bias?: SearchBias };
export type NeighborhoodSelection = LocationSelectionPayload & { state?: string; district?: string };
type RankedSelection = NeighborhoodSelection & { point?: SearchBias };

const dhaka: RankedSelection = {
  city: 'Dhaka', country: 'Bangladesh', formatted_location: 'Dhaka, Bangladesh',
  latitude: 23.8103, longitude: 90.4125, provider_place_id: 'fallback-dhaka-bangladesh',
  point: { lat: 23.8103, lng: 90.4125 },
};
// Reviewed names retain city-level coordinates. Directional names are never generated.
const reviewedAreas: RankedSelection[] = ['Badda', 'Merul Badda', 'South Badda', 'West Rampura', 'Banasree', 'Gulshan', 'Mohakhali'].map(name => ({
  ...dhaka, registrationArea: { name, placeId: 'bloodnet:bd:dhaka:' + normalizeLocation(name).replaceAll(' ', '-') },
}));
const PlaceSchema = z.object({
  city: z.string().trim().min(1).max(120), country: z.string().trim().min(1).max(120),
  country_code: z.string().regex(/^[a-z]{2}$/i), place_id: z.string().min(1).max(256),
  result_type: z.string(), state: z.string().max(120).optional(), county: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180),
  name: z.string().max(120).optional(), address_line1: z.string().max(300).optional(),
  suburb: z.string().max(120).optional(), district: z.string().max(120).optional(),
  neighbourhood: z.string().max(120).optional(), street: z.string().optional(), housenumber: z.string().optional(),
});
type Place = z.infer<typeof PlaceSchema>;
const citySelection = (place: Place): RankedSelection => ({
  city: place.city, country: place.country, state: place.state, district: place.county, point: { lat: place.lat, lng: place.lon },
  formatted_location: `${place.city}, ${place.country}`, latitude: place.lat,
  longitude: place.lon, provider_place_id: place.place_id,
});
const sameCountry = (a: string, b: string) => (locationCountry(a)?.code || normalizeLocation(a)) === (locationCountry(b)?.code || normalizeLocation(b));
const sameContext = (place: NeighborhoodSelection, context?: NeighborhoodContext) => !context ||
  ((!context.city || normalizeLocation(place.city) === normalizeLocation(context.city)) &&
   (!context.country || sameCountry(place.country, context.country)) &&
   (!context.state || normalizeLocation(place.state || '') === normalizeLocation(context.state)));

export function matchesLocationQuery(place: NeighborhoodSelection, query: string): boolean {
  const explicit = explicitLocationCountry(query);
  if (explicit && explicit.code !== locationCountry(place.country)?.code) return false;
  const text = withoutExplicitCountry(query);
  if (!normalizeLocation(text)) return false;
  const words = normalizeLocation([place.registrationArea?.name, place.city, place.district, place.state].filter(Boolean).join(' ')).split(' ');
  const parts = text.split(',').map(normalizeLocation).filter(Boolean);
  if (parts.length >= 2 && ![place.city, place.district || '', place.state || ''].some(value => normalizeLocation(value).startsWith(parts[1]))) return false;
  return normalizeLocation(text).split(' ').every(word => words.some(part => part.startsWith(word)));
}
function relevance(place: NeighborhoodSelection, query: string) {
  const name = normalizeLocation(place.registrationArea?.name || place.city);
  const text = normalizeLocation(withoutExplicitCountry(query).split(',')[0]);
  if (name === text) return 0;
  if (name.startsWith(text)) return 1;
  return 2;
}
function distance(point: SearchBias | undefined, origin: SearchBias | undefined) {
  if (!point || !origin) return Number.POSITIVE_INFINITY;
  const rad = Math.PI / 180;
  const a = Math.sin((point.lat - origin.lat) * rad / 2) ** 2 +
    Math.cos(point.lat * rad) * Math.cos(origin.lat * rad) * Math.sin((point.lng - origin.lng) * rad / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}
type ProviderSelections = { data: RankedSelection[]; limited: boolean };
const cache = new Map<string, { expires: number; data: ProviderSelections }>();
const pending = new Map<string, Promise<ProviderSelections>>();

async function providerLookup(text: string, apiKey: string, cityOnly = false, context?: NeighborhoodContext): Promise<Place[]> {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.search = new URLSearchParams({ text, apiKey, format: 'json', limit: '20', lang: 'en' }).toString();
  if (cityOnly) url.searchParams.set('type', 'city');
  const code = context?.countryCode || locationCountry(context?.country)?.code;
  if (code) url.searchParams.set('filter', 'countrycode:' + code.toLowerCase());
  if (context?.bias) url.searchParams.set('bias', `proximity:${context.bias.lng},${context.bias.lat}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
  if (!response.ok) throw new Error('Location provider unavailable.');
  const data = await response.json();
  if (!Array.isArray(data?.results)) throw new Error('Invalid location provider response.');
  return data.results.slice(0, 20).flatMap((row: unknown) => {
    const parsed = PlaceSchema.safeParse(row);
    if (!parsed.success || (code && parsed.data.country_code.toLowerCase() !== code.toLowerCase())) return [];
    const namedCountry = locationCountry(parsed.data.country);
    if (namedCountry && namedCountry.code !== parsed.data.country_code.toLowerCase()) return [];
    const place = { ...parsed.data, country: locationCountry(parsed.data.country_code)?.name || parsed.data.country };
    return !context?.country || sameCountry(place.country, context.country) ? [place] : [];
  });
}

async function verifiedProviderSelections(text: string, apiKey: string, context: NeighborhoodContext | undefined, includeAreas: boolean): Promise<ProviderSelections> {
  const query = context?.city ? `${text}, ${context.city}, ${context.country}` : text;
  const places = await providerLookup(query, apiKey, !includeAreas, context);
  const output: RankedSelection[] = places.filter(place => place.result_type === 'city').map(citySelection);
  let limited = places.length >= 20;
  if (!includeAreas) return { data: output, limited };
  const groups = new Map<string, Place[]>();
  for (const place of places) {
    if (!['suburb', 'district', 'neighbourhood', 'city_district', 'subdistrict', 'quarter', 'borough'].includes(place.result_type) || place.street || place.housenumber) continue;
    const key = [place.country_code, place.state || '', place.county || '', place.city].map(normalizeLocation).join('|');
    if (!groups.has(key) && groups.size >= 8) { limited = true; continue; }
    groups.set(key, [...(groups.get(key) || []), place]);
  }
  const jobs = [...groups.values()];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, jobs.length) }, async () => {
    while (next < jobs.length) {
      const areas = jobs[next++], place = areas[0];
      try {
        const rows = await providerLookup([place.city, place.county, place.state, place.country].filter(Boolean).join(', '), apiKey, true, {
          country: place.country, countryCode: place.country_code,
        });
        const matches = new Map(rows.filter(row => row.result_type === 'city' &&
          normalizeLocation(row.city) === normalizeLocation(place.city) &&
          (!place.county || !row.county || normalizeLocation(row.county) === normalizeLocation(place.county)) &&
          (!place.state || normalizeLocation(row.state || '') === normalizeLocation(place.state))).map(row => [row.place_id, row]));
        if (matches.size !== 1) continue;
        const city = matches.values().next().value!;
        for (const area of areas) {
          const name = area.name || area.neighbourhood || area.address_line1 || (area.result_type === 'suburb' ? area.suburb : area.district);
          if (!name || name.length > 120 || normalizeLocation(name) === normalizeLocation(city.city)) continue;
          output.push({ ...citySelection(city), district: area.county || city.county, point: { lat: area.lat, lng: area.lon }, registrationArea: { name, placeId: area.place_id } });
        }
      } catch { /* Other parent groups and reviewed locations remain usable. */ }
    }
  }));
  return { data: output, limited };
}

export async function searchLocations(text: string, context?: NeighborhoodContext, includeAreas = true) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  const cacheKey = JSON.stringify([normalizeLocation(text), context, includeAreas, apiKey]);
  let provider: RankedSelection[] = [], unavailable = !apiKey, providerLimited = false;
  if (apiKey) {
    const saved = cache.get(cacheKey);
    if (saved && saved.expires > Date.now()) { provider = saved.data.data; providerLimited = saved.data.limited; }
    else {
      let lookup = pending.get(cacheKey);
      if (!lookup && pending.size < 32) {
        lookup = verifiedProviderSelections(text, apiKey, context, includeAreas);
        pending.set(cacheKey, lookup);
      }
      try {
        if (!lookup) throw new Error('Location service busy.');
        const result = await lookup;
        provider = result.data;
        providerLimited = result.limited;
        if (provider.length && process.env.NODE_ENV !== 'test') {
          if (cache.size >= 256) cache.delete(cache.keys().next().value!);
          cache.set(cacheKey, { expires: Date.now() + 300000, data: result });
        }
      } catch { unavailable = true; }
      finally { pending.delete(cacheKey); }
    }
  }
  const fallbackCities: RankedSelection[] = FALLBACK_CITY_DATA.map(city => ({
    city: city.city, country: city.country, formatted_location: `${city.city}, ${city.country}`,
    latitude: city.lat, longitude: city.lon, point: { lat: city.lat, lng: city.lon },
    provider_place_id: `fallback-${city.city.toLowerCase().replaceAll(' ', '-')}-${city.country.toLowerCase().replaceAll(' ', '-')}`,
  }));
  const reviewed = includeAreas ? reviewedAreas : [];
  const fallback = [...reviewed, ...fallbackCities].filter(area => !provider.some(place =>
    sameCountry(place.country, area.country) && normalizeLocation(place.city) === normalizeLocation(area.city) &&
    normalizeLocation(place.registrationArea?.name || '') === normalizeLocation(area.registrationArea?.name || '')));
  const matching = [...provider, ...fallback].filter(place => sameContext(place, context) && matchesLocationQuery(place, text));
  const unique = new Map<string, RankedSelection>();
  for (const place of matching) {
    const key = [place.country, place.state || '', place.city, place.registrationArea?.name || ''].map(normalizeLocation).join('|');
    if (!unique.has(key)) unique.set(key, place);
  }
  const ordered = [...unique.values()].sort((a, b) => relevance(a, text) - relevance(b, text) ||
    distance(a.point, context?.bias) - distance(b.point, context?.bias) ||
    [a.registrationArea?.name || a.city, a.city, a.state, a.country].join(',').localeCompare([b.registrationArea?.name || b.city, b.city, b.state, b.country].join(',')));
  // Keep a city-only choice beside an area without losing related area variants to duplicates.
  for (const place of [...ordered]) if (place.registrationArea && !ordered.some(row => !row.registrationArea && row.provider_place_id === place.provider_place_id)) {
    const { registrationArea, ...city } = place;
    ordered.push(city);
  }
  return { data: ordered.slice(0, 20).map(({ point, ...place }) => place), unavailable, limited: providerLimited || ordered.length >= 20 };
}

export async function lookupNeighborhoods(text: string, context?: NeighborhoodContext): Promise<NeighborhoodSelection[]> {
  return (await searchLocations(text, context)).data;
}
