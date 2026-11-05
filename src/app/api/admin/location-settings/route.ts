import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { securityJson } from '@/src/backend/utils/security';
import { privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { LocationSettingsSchema } from '@/src/lib/locationSettings';
import { getLocationSettings, saveLocationSettings } from '@/src/backend/services/locationSettings';

export const GET = withActiveAdmin(async () =>
  NextResponse.json(
    { success: true, data: await getLocationSettings() },
    { headers: privateHeaders },
  ),
);
export const PATCH = withActiveAdmin(async (req: Request) => {
  const parsed = z
    .object({ settings: LocationSettingsSchema, revision: z.number().int().positive() })
    .strict()
    .safeParse(await securityJson(req, 2048));
  if (!parsed.success)
    return NextResponse.json(
      { success: false, message: 'Choose valid location settings.' },
      { status: 400, headers: privateHeaders },
    );
  try {
    const data = await saveLocationSettings(parsed.data.settings, parsed.data.revision);
    return NextResponse.json({ success: true, data }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof Error && error.message === 'LOCATION_SETTINGS_CONFLICT')
      return NextResponse.json(
        {
          success: false,
          message: 'Another administrator changed these settings. Reload before saving.',
        },
        { status: 409, headers: privateHeaders },
      );
    throw error;
  }
});
