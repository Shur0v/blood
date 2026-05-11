import { NextResponse } from 'next/server';

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

    if (!country) {
      return NextResponse.json(
        { success: false, message: 'IP location unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        country,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to detect IP location.' }, { status: 500 });
  }
}

