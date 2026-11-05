import { getPrisma } from '../config/db';
import {
  DEFAULT_LOCATION_SETTINGS,
  LocationSettingsSchema,
  type LocationSettings,
} from '@/src/lib/locationSettings';

export function initialLocationSettings(): LocationSettings {
  const legacy = process.env.NEIGHBORHOODS_ENABLED ?? process.env.SIGNUP_NEIGHBORHOODS_ENABLED;
  return {
    ...DEFAULT_LOCATION_SETTINGS,
    detail: legacy === undefined || legacy === 'true' ? 'detailed' : 'cities',
  };
}

export async function getLocationSettings(): Promise<LocationSettings> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production')
    return initialLocationSettings();
  const db = getPrisma();
  const { revision, ...initial } = initialLocationSettings();
  let row = await db.locationSettings.findUnique({ where: { id: 'account-locations' } });
  if (!row) {
    await db.locationSettings.createMany({
      data: [{ id: 'account-locations', settings: LocationSettingsSchema.parse(initial) }],
      skipDuplicates: true,
    });
    row = await db.locationSettings.findUniqueOrThrow({ where: { id: 'account-locations' } });
  }
  return { ...LocationSettingsSchema.parse(row.settings), revision: row.revision };
}

export async function saveLocationSettings(input: unknown, expectedRevision: number) {
  const settings = LocationSettingsSchema.parse(input);
  await getLocationSettings();
  return getPrisma().$transaction(async (tx) => {
    const changed = await tx.locationSettings.updateMany({
      where: { id: 'account-locations', revision: expectedRevision },
      data: { settings, revision: { increment: 1 } },
    });
    if (!changed.count) throw new Error('LOCATION_SETTINGS_CONFLICT');
    const row = await tx.locationSettings.findUniqueOrThrow({ where: { id: 'account-locations' } });
    await tx.$queryRaw`SELECT 1 FROM pg_notify('bloodnet_ui_controls', ${JSON.stringify({ locationSettingsRevision: row.revision })})`;
    return { ...settings, revision: row.revision };
  });
}
