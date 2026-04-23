import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signLocationProof } from '@/src/backend/utils/locationProof';

const QuerySchema = z.object({
  text: z.string().min(2).max(120),
});

interface GeoapifyResponse {
  features?: Array<{
    properties?: {
      city?: string;
      country?: string;
      formatted?: string;
      lat?: number;
      lon?: number;
      place_id?: string;
      result_type?: string;
    };
  }>;
  results?: Array<{
    city?: string;
    country?: string;
    formatted?: string;
    lat?: number;
    lon?: number;
    place_id?: string;
    result_type?: string;
  }>;
}

const FALLBACK_CITY_DATA = [
  { city: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  { city: 'Chattogram', country: 'Bangladesh', lat: 22.3569, lon: 91.7832 },
  { city: 'Khulna', country: 'Bangladesh', lat: 22.8456, lon: 89.5403 },
  { city: 'Rajshahi', country: 'Bangladesh', lat: 24.3745, lon: 88.6042 },
  { city: 'Sylhet', country: 'Bangladesh', lat: 24.8949, lon: 91.8687 },
  { city: 'Barishal', country: 'Bangladesh', lat: 22.7010, lon: 90.3535 },
  { city: 'Rangpur', country: 'Bangladesh', lat: 25.7439, lon: 89.2752 },
  { city: 'Mymensingh', country: 'Bangladesh', lat: 24.7471, lon: 90.4203 },
  { city: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
  { city: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639 },
  { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
  { city: 'Karachi', country: 'Pakistan', lat: 24.8607, lon: 67.0011 },
  { city: 'Lahore', country: 'Pakistan', lat: 31.5204, lon: 74.3587 },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
  { city: 'Doha', country: 'Qatar', lat: 25.2854, lon: 51.5310 },
  { city: 'London', country: 'United Kingdom', lat: 51.5072, lon: -0.1276 },
  { city: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
];

const buildFallbackSuggestions = (queryText: string) => {
  const q = queryText.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }

  return FALLBACK_CITY_DATA
    .filter((item) => item.city.toLowerCase().includes(q) || item.country.toLowerCase().includes(q))
    .slice(0, 8)
    .map((item) => {
      const formatted_location = `${item.city}, ${item.country}`;
      const provider_place_id = `fallback-${item.city.toLowerCase().replace(/\s+/g, '-')}-${item.country.toLowerCase().replace(/\s+/g, '-')}`;
      const payload = {
        city: item.city,
        country: item.country,
        formatted_location,
        latitude: item.lat,
        longitude: item.lon,
        provider_place_id,
      };
      return {
        ...payload,
        token: signLocationProof(payload),
      };
    });
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      text: url.searchParams.get('text') || '',
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Query text must be at least 2 characters.' }, { status: 400 });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      const fallbackData = buildFallbackSuggestions(parsed.data.text);
      return NextResponse.json({
        success: true,
        data: fallbackData,
        meta: { fallback: true, reason: 'missing_api_key' },
      });
    }

    const geoUrl = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    geoUrl.searchParams.set('text', parsed.data.text);
    geoUrl.searchParams.set('type', 'city');
    geoUrl.searchParams.set('format', 'json');
    geoUrl.searchParams.set('limit', '8');
    geoUrl.searchParams.set('apiKey', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const geoRes = await fetch(geoUrl.toString(), {
      method: 'GET',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!geoRes.ok) {
      const fallbackData = buildFallbackSuggestions(parsed.data.text);
      if (fallbackData.length > 0) {
        return NextResponse.json({
          success: true,
          data: fallbackData,
          meta: { fallback: true, reason: 'geoapify_non_ok' },
        });
      }
      return NextResponse.json({ success: false, message: 'Geoapify autocomplete request failed.' }, { status: 502 });
    }

    const geoData = (await geoRes.json()) as GeoapifyResponse;
    const featureProps = (geoData.features || [])
      .map((feature) => feature.properties)
      .filter((props): props is NonNullable<typeof props> => Boolean(props));
    const resultProps = geoData.results || [];
    const entries = [...featureProps, ...resultProps];

    const seen = new Set<string>();
    const suggestions = entries
      .filter((props) => {
        const resultType = (props.result_type || '').toLowerCase();
        return resultType === 'city' || Boolean(props.city);
      })
      .filter((props) => Boolean(props.city && props.country && props.place_id))
      .map((props) => ({
        city: props.city as string,
        country: props.country as string,
        formatted_location: props.formatted || `${props.city}, ${props.country}`,
        latitude: Number(props.lat || 0),
        longitude: Number(props.lon || 0),
        provider_place_id: props.place_id as string,
      }))
      .filter((item) => {
        if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
          return false;
        }
        if (seen.has(item.provider_place_id)) {
          return false;
        }
        seen.add(item.provider_place_id);
        return true;
      })
      .map((item) => ({
        ...item,
        token: signLocationProof(item),
      }));

    const data = suggestions.length > 0 ? suggestions : buildFallbackSuggestions(parsed.data.text);
    return NextResponse.json({
      success: true,
      data,
      meta: suggestions.length > 0 ? { fallback: false } : { fallback: true, reason: 'geoapify_empty' },
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      const url = new URL(req.url);
      const text = url.searchParams.get('text') || '';
      const fallbackData = buildFallbackSuggestions(text);
      if (fallbackData.length > 0) {
        return NextResponse.json({
          success: true,
          data: fallbackData,
          meta: { fallback: true, reason: 'timeout' },
        });
      }
      return NextResponse.json(
        { success: false, message: 'City lookup timed out. Please try again in a moment.' },
        { status: 504 },
      );
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch city suggestions.' }, { status: 500 });
  }
}
