import { z } from 'zod';
import type { LocationSelectionPayload } from '../utils/locationProof';
import { explicitLocationCountry, locationCountry, normalizeLocationText, withoutExplicitCountry } from '@/src/lib/locationCountry';
import type { SearchBias } from './locationSearchContext';
import { FALLBACK_CITY_DATA } from '../data/locationFallbacks';
import { getLocationSettings } from './locationSettings';
import { districtIdentity } from './locationDistrict';

export const neighborhoodsEnabled = async () => (await getLocationSettings()).detail === 'detailed';
export const normalizeLocation = normalizeLocationText;
export type NeighborhoodContext = { city?: string; country?: string; state?: string; countryCode?: string; bias?: SearchBias; nearbyFirst?: boolean; typoSuggestions?: boolean; districtKey?: string };
export type NeighborhoodSelection = LocationSelectionPayload & { state?: string; district?: string; selectionId?: string; placeType?: string; corrected?: boolean };
type SearchEvidence = { searchNames?: string[]; providerConfidence?: number };
type RankedSelection = NeighborhoodSelection & SearchEvidence & { point?: SearchBias };

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
  city: z.string().trim().max(120).optional(), town: z.string().max(120).optional(), village: z.string().max(120).optional(), municipality: z.string().max(120).optional(), country: z.string().trim().min(1).max(120),
  country_code: z.string().regex(/^[a-z]{2}$/i), place_id: z.string().min(1).max(256),
  result_type: z.string(), state: z.string().max(120).optional(), county: z.string().max(120).optional(), state_district: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180),
  name: z.string().max(120).optional(), address_line1: z.string().max(300).optional(),
  suburb: z.string().max(120).optional(), district: z.string().max(120).optional(),
  neighbourhood: z.string().max(120).optional(), street: z.string().optional(), housenumber: z.string().optional(),
  rank: z.object({ confidence: z.number().optional(), match_type: z.string().optional() }).passthrough().optional(),
  datasource: z.object({ raw: z.record(z.string(), z.unknown()).optional() }).passthrough().optional(),
});
type Place = z.infer<typeof PlaceSchema>;
function searchEvidence(place: Place): SearchEvidence {
  const searchNames = Object.entries(place.datasource?.raw || {}).filter(([key]) => /^(name(?::.*)?|alt_name|old_name)$/.test(key))
    .flatMap(([, value]) => typeof value === 'string' && value.length <= 500 ? value.split(';') : []);
  const providerConfidence = ['full_match', 'fuzzy_match'].includes(place.rank?.match_type || '') ? place.rank?.confidence : undefined;
  return { searchNames, providerConfidence };
}
const administrativeTypes = new Set(['county', 'state_district']);
const settlementName = (place: Place) => administrativeTypes.has(place.result_type) ? place.name || place.state_district || place.county || '' : place.city || place.town || place.village || place.municipality || place.name || place.county || '';
const settlementTypes = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'locality']);
const areaTypes = new Set(['suburb', 'district', 'neighbourhood', 'neighborhood', 'city_district', 'subdistrict', 'quarter', 'borough']);

function localAreaName(place: Place, parent?: string) {
  const parents = [parent, place.country, place.state, place.county].filter(Boolean).map(value => normalizeLocation(value!));
  return [place.name, place.neighbourhood, place.suburb, place.district, place.address_line1]
    .find(name => name && name.length <= 120 && !parents.includes(normalizeLocation(name)));
}

const citySelection = (place: Place): RankedSelection => ({
  ...searchEvidence(place),
  city: settlementName(place), country: place.country, state: place.state, district: districtIdentity(place)?.name, districtKey: districtIdentity(place)?.key, placeType: place.result_type, point: { lat: place.lat, lng: place.lon },
  formatted_location: `${settlementName(place)}, ${place.country}`, latitude: place.lat,
  longitude: place.lon, provider_place_id: place.place_id,
});
const sameCountry = (a: string, b: string) => (locationCountry(a)?.code || normalizeLocation(a)) === (locationCountry(b)?.code || normalizeLocation(b));
const sameContext = (place: NeighborhoodSelection, context?: NeighborhoodContext) => !context ||
  ((!context.city || normalizeLocation(place.city) === normalizeLocation(context.city)) &&
   (!context.country || sameCountry(place.country, context.country)) &&
   (!context.state || normalizeLocation(place.state || '') === normalizeLocation(context.state)));

function closeWord(input: string, candidate: string) {
  if (candidate.startsWith(input)) return true;
  if (input.length < 4 || Math.abs(input.length - candidate.length) > 2) return false;
  const limit = input.length >= 8 ? 2 : 1;
  const rows = Array.from({ length: input.length + 1 }, (_, i) => [i, ...Array(candidate.length).fill(0)]);
  rows[0] = Array.from({ length: candidate.length + 1 }, (_, i) => i);
  for (let i = 1; i <= input.length; i++) for (let j = 1; j <= candidate.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + Number(input[i - 1] !== candidate[j - 1]));
    if (i > 1 && j > 1 && input[i - 1] === candidate[j - 2] && input[i - 2] === candidate[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
  }
  return rows[input.length][candidate.length] <= limit;
}
export function matchesLocationQuery(place: NeighborhoodSelection & SearchEvidence, query: string, fuzzy = true): boolean {
  const explicit = explicitLocationCountry(query);
  if (explicit && explicit.code !== locationCountry(place.country)?.code) return false;
  const queryParts = withoutExplicitCountry(query).split(',').map(normalizeLocation).filter(Boolean);
  if (queryParts.length > 1 && ![place.city, place.district || '', place.state || ''].some(value => normalizeLocation(value).startsWith(queryParts[1]))) return false;
  const text = normalizeLocation(withoutExplicitCountry(query));
  if (!text) return false;
  const names = normalizeLocation([place.registrationArea?.name, place.city, place.district, place.state, ...(place.searchNames || [])].filter(Boolean).join(' '));
  const words = names.split(' ');
  return text.split(' ').every(word => words.some(part => fuzzy ? closeWord(word, part) : part.startsWith(word))) ||
    (fuzzy && text.length >= 3 && (place.providerConfidence || 0) >= 0.85);
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

async function providerLookup(text: string, apiKey: string, cityOnly = false, context?: NeighborhoodContext, search = false): Promise<Place[]> {
  const url = new URL('https://api.geoapify.com/v1/geocode/' + (search ? 'search' : 'autocomplete'));
  url.search = new URLSearchParams({ text, apiKey, format: 'json', limit: search ? '100' : '20', lang: 'en', type: cityOnly ? 'city' : 'locality' }).toString();
  const code = context?.countryCode || locationCountry(context?.country)?.code;
  if (code) url.searchParams.set('filter', 'countrycode:' + code.toLowerCase());
  if (context?.bias) url.searchParams.set('bias', 'proximity:' + context.bias.lng + ',' + context.bias.lat);
  const response = await fetch(url, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
  if (!response.ok) throw new Error('Location provider unavailable.');
  const data = await response.json();
  if (!Array.isArray(data?.results)) throw new Error('Invalid location provider response.');
  return data.results.flatMap((row: unknown) => {
    const parsed = PlaceSchema.safeParse(row);
    if (!parsed.success || (code && parsed.data.country_code.toLowerCase() !== code.toLowerCase())) return [];
    const namedCountry = locationCountry(parsed.data.country);
    if (namedCountry && namedCountry.code !== parsed.data.country_code.toLowerCase()) return [];
    const place = { ...parsed.data, country: locationCountry(parsed.data.country_code)?.name || parsed.data.country };
    return !context?.country || sameCountry(place.country, context.country) ? [place] : [];
  });
}

async function reverseParent(place: Place, apiKey: string): Promise<Place | undefined> {
  const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
  url.search = new URLSearchParams({ lat: String(place.lat), lon: String(place.lon), type: 'city', format: 'json', lang: 'en', apiKey }).toString();
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
  if (!response.ok) return undefined;
  const body = await response.json();
  const parsed = PlaceSchema.safeParse(body.results?.[0]);
  if (!parsed.success || parsed.data.country_code.toLowerCase() !== place.country_code.toLowerCase() || !settlementTypes.has(parsed.data.result_type)) return undefined;
  const parent = place.city || place.town || place.village || place.municipality;
  if (parent && normalizeLocation(parent) !== normalizeLocation(settlementName(parsed.data))) return undefined;
  return { ...parsed.data, country: place.country };
}

async function verifiedProviderSelections(text: string, apiKey: string, context: NeighborhoodContext | undefined, includeAreas: boolean): Promise<ProviderSelections> {
  const query = context?.city ? [text, context.city, context.country].filter(Boolean).join(', ') : text;
  const national = { ...context, bias: undefined };
  const requests = [providerLookup(query, apiKey, !includeAreas, national)];
  if (context?.bias && context.nearbyFirst !== false) requests.push(providerLookup(query, apiKey, !includeAreas, context));
  const batches = await Promise.allSettled(requests);
  const successful = batches.filter((result): result is PromiseFulfilledResult<Place[]> => result.status === 'fulfilled');
  if (!successful.length) throw new Error('Location provider unavailable.');
  const placesById = new Map(successful.flatMap(result => result.value).map(place => [place.place_id, place]));
  let limited = successful.length !== requests.length;
  if (limited || successful.some(batch => batch.value.length >= 20) || placesById.size < 5) {
    try {
      const expanded = await providerLookup(query, apiKey, !includeAreas, national, true);
      limited = expanded.length >= 100;
      for (const place of expanded) placesById.set(place.place_id, place);
    } catch { limited = true; }
  }
  const places = [...placesById.values()];
  const output = places.filter(place => (settlementTypes.has(place.result_type) || includeAreas && administrativeTypes.has(place.result_type)) && settlementName(place)).map(citySelection);
  if (!includeAreas) return { data: output, limited };
  const groups = new Map<string, Place[]>();
  for (const place of places) {
    if (!areaTypes.has(place.result_type) || place.street || place.housenumber) continue;
    const candidateName = localAreaName(place, place.city || place.town || place.village || place.municipality);
    if (!candidateName) continue;
    const candidate = { ...citySelection(place), registrationArea: { name: candidateName, placeId: place.place_id },
      searchNames: [...(searchEvidence(place).searchNames || []), place.neighbourhood || '', place.suburb || '', place.district || ''] };
    if (!matchesLocationQuery(candidate, text, context?.typoSuggestions !== false)) continue;
    const parent = place.city || place.town || place.village || place.municipality;
    const key = [place.country_code, place.state || '', place.county || '', parent || place.place_id].map(normalizeLocation).join('|');
    groups.set(key, [...(groups.get(key) || []), place]);
  }
  const jobs = [...groups.values()];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, jobs.length) }, async () => {
    while (next < jobs.length) {
      const areas = jobs[next++], place = areas[0];
      const parent = place.city || place.town || place.village || place.municipality!;
      try {
        let rows: Place[] = [];
        if (parent) {
          try {
            rows = await providerLookup([parent, place.county, place.state, place.country].filter(Boolean).join(', '), apiKey, true, { country: place.country, countryCode: place.country_code });
          } catch { /* Reverse lookup can independently verify the parent. */ }
        }
        const matches = new Map(rows.filter(row => settlementTypes.has(row.result_type) &&
          normalizeLocation(settlementName(row)) === normalizeLocation(parent) &&
          (!place.county || !row.county || normalizeLocation(row.county) === normalizeLocation(place.county)) &&
          (!place.state || !row.state || normalizeLocation(row.state) === normalizeLocation(place.state))).map(row => [row.place_id, row]));
        const city = matches.size === 1 ? matches.values().next().value! : await reverseParent(place, apiKey);
        if (!city) { limited = true; continue; }
        for (const area of areas) {
          const name = localAreaName(area, settlementName(city));
          if (!name || name.length > 120 || normalizeLocation(name) === normalizeLocation(settlementName(city))) continue;
          output.push({ ...citySelection(city), district: districtIdentity(area)?.name || districtIdentity(city)?.name,
            ...searchEvidence(area),
            districtKey: districtIdentity(area)?.key || districtIdentity(city)?.key, placeType: area.result_type,
            point: { lat: area.lat, lng: area.lon }, registrationArea: { name, placeId: area.place_id } });
        }
      } catch { limited = true; }
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
  const matching = [...provider, ...fallback].filter(place => sameContext(place, context) && (!context?.districtKey || place.districtKey === context.districtKey) && matchesLocationQuery(place, text, context?.typoSuggestions !== false));
  const unique = new Map<string, RankedSelection>();
  for (const place of matching) {
    const key = JSON.stringify([place.country, place.state || '', place.district || '', place.city].map(normalizeLocation).concat(place.registrationArea?.placeId || place.provider_place_id));
    if (!unique.has(key)) unique.set(key, place);
  }
  const ordered = [...unique.values()].sort((a, b) => relevance(a, text) - relevance(b, text) ||
    (context?.nearbyFirst === false ? 0 : (distance(a.point, context?.bias) - distance(b.point, context?.bias))) ||
    [a.registrationArea?.name || a.city, a.city, a.state, a.country].join(',').localeCompare([b.registrationArea?.name || b.city, b.city, b.state, b.country].join(',')));
  // Keep a city-only choice beside an area without losing related area variants to duplicates.
  for (const place of [...ordered]) if (place.registrationArea && !ordered.some(row => !row.registrationArea && row.provider_place_id === place.provider_place_id)) {
    const { registrationArea, ...city } = place;
    ordered.push(city);
  }
  return { data: ordered.map(({ point, searchNames, providerConfidence, ...place }) => ({ ...place, selectionId: place.registrationArea?.placeId || place.provider_place_id, corrected: !matchesLocationQuery(place, text, false) })), unavailable, limited: providerLimited };
}

export async function lookupNeighborhoods(text: string, context?: NeighborhoodContext): Promise<NeighborhoodSelection[]> {
  return (await searchLocations(text, context)).data;
}
