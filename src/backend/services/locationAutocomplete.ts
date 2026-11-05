import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveLocationSearch } from './locationSearchContext';
import { searchLocations } from './neighborhoods';
import { signLocationProof } from '../utils/locationProof';

const Query = z.string().trim().min(3).max(120);
const attempts = new Map<string, { count: number; until: number }>();

export async function locationAutocomplete(req: Request, includeAreas: boolean) {
  const query = Query.safeParse(new URL(req.url).searchParams.get('text'));
  if (!query.success) return NextResponse.json({ success: false, message: 'Type at least three characters, up to 120.' }, { status: 400 });
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
    const context = await resolveLocationSearch(req, query.data);
    if (!context) return NextResponse.json({ success: true, data: [], meta: {
      requiresCountry: true, message: 'Choose your country or write its full name with the location.',
    } }, { headers });
    const result = await searchLocations(context.text, context, includeAreas);
    return NextResponse.json({ success: true, data: result.data.map(payload => ({ ...payload, token: signLocationProof(payload) })), meta: {
      country: context.country, limited: result.limited,
      message: result.limited ? 'Add more letters, a city or district to narrow these results.' :
        !result.data.length ? result.unavailable ? 'Location lookup is unavailable. Please retry or search for your city.' : 'No verified matches in this country. Try a city or district.' : '',
    } }, { headers });
  } catch {
    return NextResponse.json({ success: false, message: 'Location search is temporarily unavailable. Please retry shortly.' }, { status: 503, headers });
  }
}
