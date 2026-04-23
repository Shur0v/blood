import { NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const FALLBACK_CITY_DATA = [
  { city: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  { city: 'Chattogram', country: 'Bangladesh', lat: 22.3569, lng: 91.7832 },
  { city: 'Khulna', country: 'Bangladesh', lat: 22.8456, lng: 89.5403 },
  { city: 'Rajshahi', country: 'Bangladesh', lat: 24.3745, lng: 88.6042 },
  { city: 'Sylhet', country: 'Bangladesh', lat: 24.8949, lng: 91.8687 },
  { city: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
];

const toRad = (v: number) => (v * Math.PI) / 180;
const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const r = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const sa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
};

const resolveFallback = (lat: number, lng: number) => {
  const closest = FALLBACK_CITY_DATA
    .map((item) => ({
      ...item,
      distance: distanceKm(lat, lng, item.lat, item.lng),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  return { city: closest.city, country: closest.country };
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      lat: url.searchParams.get('lat'),
      lng: url.searchParams.get('lng'),
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid coordinates.' }, { status: 400 });
    }

    const { lat, lng } = parsed.data;
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: true, data: resolveFallback(lat, lng), meta: { fallback: true } });
    }

    const reverseUrl = new URL('https://api.geoapify.com/v1/geocode/reverse');
    reverseUrl.searchParams.set('lat', String(lat));
    reverseUrl.searchParams.set('lon', String(lng));
    reverseUrl.searchParams.set('type', 'city');
    reverseUrl.searchParams.set('format', 'json');
    reverseUrl.searchParams.set('apiKey', apiKey);

    const response = await fetch(reverseUrl.toString(), { method: 'GET' });
    if (!response.ok) {
      return NextResponse.json({ success: true, data: resolveFallback(lat, lng), meta: { fallback: true } });
    }

    const payload = (await response.json()) as {
      results?: Array<{ city?: string; country?: string }>;
      features?: Array<{ properties?: { city?: string; country?: string } }>;
    };

    const city =
      payload.results?.[0]?.city ||
      payload.features?.[0]?.properties?.city ||
      resolveFallback(lat, lng).city;
    const country =
      payload.results?.[0]?.country ||
      payload.features?.[0]?.properties?.country ||
      resolveFallback(lat, lng).country;

    return NextResponse.json({
      success: true,
      data: { city, country },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to detect location.' }, { status: 500 });
  }
}

