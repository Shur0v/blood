import { getCountries } from 'libphonenumber-js/min';

export const normalizeLocationText = (value: string) => value.normalize('NFKD').replace(/([a-z])\p{M}+/giu, '$1').normalize('NFKC').toLocaleLowerCase('en')
  .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const LOCATION_COUNTRIES = [...new Set<string>([...getCountries(), 'AQ', 'BV', 'HM', 'TF', 'UM'])]
  .map(code => ({ code: code.toLowerCase(), name: displayNames.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

const fullNames = [
  ...LOCATION_COUNTRIES.map(country => ({ ...country, match: normalizeLocationText(country.name) })),
  ...Object.entries({
    'United States of America': 'us', 'Russian Federation': 'ru', 'Viet Nam': 'vn',
    'Republic of Korea': 'kr', 'Türkiye': 'tr', 'Czech Republic': 'cz',
  }).map(([name, code]) => ({ code, name: displayNames.of(code.toUpperCase())!, match: normalizeLocationText(name) })),
].sort((a, b) => b.match.length - a.match.length);

export function locationCountry(value?: string | null) {
  const normalized = normalizeLocationText(value || '');
  return LOCATION_COUNTRIES.find(country => country.code === normalized || normalizeLocationText(country.name) === normalized)
    || fullNames.find(country => country.match === normalized);
}

export function sameLocationParent(a: { city: string; country: string; provider_place_id?: string | null }, b: { city: string; country: string; provider_place_id?: string | null }) {
  const countryA = locationCountry(a.country)?.code || normalizeLocationText(a.country);
  const countryB = locationCountry(b.country)?.code || normalizeLocationText(b.country);
  if (normalizeLocationText(a.city) !== normalizeLocationText(b.city) || countryA !== countryB) return false;
  // Legacy city references may be absent; reviewed city fallbacks have stable app IDs.
  return !a.provider_place_id || !b.provider_place_id || a.provider_place_id === b.provider_place_id ||
    a.provider_place_id.startsWith('fallback-') || b.provider_place_id.startsWith('fallback-');
}

// Full names only. Short codes and partial country names cannot override detection.
export function explicitLocationCountry(text: string) {
  const normalized = normalizeLocationText(text);
  const padded = ` ${normalized} `;
  return fullNames.find(country => padded.includes(` ${country.match} `));
}

export function withoutExplicitCountry(text: string) {
  const country = explicitLocationCountry(text);
  if (!country) return text.trim();
  const escaped = country.match.split(' ').map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s,]+');
  return text.split(',').map(normalizeLocationText).join(', ').replace(new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${escaped}(?![\\p{L}\\p{M}\\p{N}])`, 'iu'), ' ')
    .replace(/,\s*,/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '').trim();
}
