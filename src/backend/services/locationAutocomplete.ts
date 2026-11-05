import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveLocationSearch } from './locationSearchContext';
import { searchLocations } from './neighborhoods';
import { signLocationProof } from '../utils/locationProof';
import { accountLocationPolicy, policySelection } from './locationPolicy';
import { normalizeLocationText } from '@/src/lib/locationCountry';

const Query = z.string().trim().min(2).max(120);
const attempts = new Map<string, { count: number; until: number }>();

export async function locationAutocomplete(req: Request, includeAreas: boolean, accountPicker = false) {
  const query = Query.safeParse(new URL(req.url).searchParams.get('text'));
  if (!query.success || normalizeLocationText(query.data).length < 2) return NextResponse.json({ success: false, message: 'Type at least two characters, up to 120.' }, { status: 400 });
  const client = req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  let bucket = attempts.get(client);
  if (!bucket || bucket.until <= now) {
    if (attempts.size >= 2048) for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
    if (attempts.size >= 2048 && !attempts.has(client)) return NextResponse.json({ success: false, message: 'Location search is busy. Please retry shortly.' }, { status: 429 });
    bucket = { count: 0, until: now + 60000 };
    attempts.set(client, bucket);
  }
  if (++bucket.count > 60) return NextResponse.json({ success: false, message: 'Please wait before searching again.' }, { status: 429, headers: { 'Retry-After': '60' } });
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    const policy = accountPicker ? await accountLocationPolicy(req) : undefined;
    if (policy?.requiresLocation) return NextResponse.json({ success: true, data: [], meta: { requiresLocation: true, message: 'Confirm your current location to search within your detected district.', settings: policy.settings } }, { headers });
    const context = await resolveLocationSearch(req, query.data);
    if (!context) return NextResponse.json({ success: true, data: [], meta: {
      requiresCountry: true, message: 'Choose your country or write its full name with the location.',
    } }, { headers });
    if (!context.text) return NextResponse.json({ success: true, data: [], meta: { message: 'Type a place name with the country.', settings: policy?.settings } }, { headers });
    if (policy?.district && policy.district.country !== context.country) return NextResponse.json({ success: true, data: [], meta: { message: 'Location selection is restricted to your current detected district.', settings: policy.settings } }, { headers });
    const result = await searchLocations(context.text, { ...context,
      nearbyFirst: policy?.settings.nearbyFirst, typoSuggestions: policy?.settings.typoSuggestions,
      districtKey: policy?.district?.key,
    }, policy ? policy.settings.detail === 'detailed' : includeAreas);
    return NextResponse.json({ success: true, data: result.data.map(payload => ({ ...payload, token: signLocationProof(policy ? policySelection(req, payload, policy.settings) : payload) })), meta: {
      settings: policy?.settings, district: policy?.district, total: result.data.length,
      country: context.country, limited: result.limited,
      message: result.unavailable ? 'Live location lookup is unavailable. Showing reviewed fallback matches when available. Please retry for wider coverage.' :
        result.limited ? 'The provider returned a limited set of matches. Add a city or district to find a more specific place.' :
        !result.data.length ? 'No verified matches in this country. Try a city or district.' : '',
    } }, { headers });
  } catch {
    return NextResponse.json({ success: false, message: 'Location search is temporarily unavailable. Please retry shortly.' }, { status: 503, headers });
  }
}
