import { NextResponse } from 'next/server';
import { automaticIpLocation } from '@/src/backend/services/automaticLocation';
import {normalizeCountryToken} from '@/src/lib/geoCountry';

export const dynamic = 'force-dynamic';

const countryNameFromCode = (code?: string | null) => {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized || normalized.length !== 2) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(normalized) || null;
  } catch {
    return null;
  }
};

export async function GET(req: Request) {
  try {
    const countryCode =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-country-code') ||
      req.headers.get('cloudfront-viewer-country');

    const country = countryNameFromCode(countryCode);
    const detailed=new URL(req.url).searchParams.get('detail')==='city';
    const approximate=!country||detailed?await automaticIpLocation(req):null;
    // Keep the proxy's country authoritative and never attach a different
    // country's city/coordinates to it. The default country response stays fast.
    const detected = country ? {...(approximate&&normalizeCountryToken(approximate.country)===normalizeCountryToken(country)?approximate:{}),country} : approximate;

    if (!detected) {
      return NextResponse.json(
        { success: false, message: 'IP location unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: detected,
    }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'x-vercel-ip-country, cf-ipcountry, x-country-code, cloudfront-viewer-country' } });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to detect IP location.' }, { status: 500 });
  }
}

