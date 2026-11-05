import { NextResponse } from 'next/server';
import { detectedVisitorLocation } from '@/src/backend/services/automaticLocation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const detected = await detectedVisitorLocation(req, new URL(req.url).searchParams.get('detail') === 'city');

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

