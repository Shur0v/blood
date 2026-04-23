import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { listHomepageSlides } from '@/src/backend/services/homepageSlides';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await listHomepageSlides(getPrisma(), { includeInactive: false });
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load homepage slides.' }, { status: 500 });
  }
}

