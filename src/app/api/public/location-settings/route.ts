import { NextResponse } from 'next/server';
import { getLocationSettings } from '@/src/backend/services/locationSettings';

export async function GET() {
  try {
    return NextResponse.json(
      { success: true, data: await getLocationSettings() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Location settings are temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
