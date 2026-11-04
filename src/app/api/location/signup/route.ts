import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signLocationProof } from '@/src/backend/utils/locationProof';
import { lookupNeighborhoods, matchesLocationQuery, neighborhoodsEnabled } from '@/src/backend/services/neighborhoods';
import { GET as lookupCities } from '../cities/route';

const Query = z.string().trim().min(2).max(120);
// Process-local admission limits anonymous provider usage without retaining searches.
const attempts = new Map<string, { count: number; until: number }>();
export async function GET(req: Request) {
  if (!neighborhoodsEnabled()) return lookupCities(req);
  const query = Query.safeParse(new URL(req.url).searchParams.get('text'));
  if (!query.success) return NextResponse.json({ success: false, message: 'Enter a city or neighborhood name (2–120 characters).' }, { status: 400 });
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
  const data = await lookupNeighborhoods(query.data);
  if (!data.length) {
    const fallback = await lookupCities(req);
    if (!fallback.ok) return fallback;
    const body = await fallback.json();
    return NextResponse.json({ ...body, data: (body.data || []).filter((row: Parameters<typeof matchesLocationQuery>[0]) => matchesLocationQuery(row, query.data)) }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  return NextResponse.json({ success: true, data: data.map(payload => ({ ...payload, token: signLocationProof(payload) })) }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
