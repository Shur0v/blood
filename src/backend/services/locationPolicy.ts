import { getLocationSettings } from './locationSettings';
import { detectLocationDistrict, locationVisitorKey } from './locationDistrict';
import type { LocationSelectionPayload } from '../utils/locationProof';
import { MedicalError } from '../utils/medicalPrivacy';
import type { LocationSettings } from '@/src/lib/locationSettings';
import { LocationSettingsSchema } from '@/src/lib/locationSettings';
import type { Prisma } from '@prisma/client';

export async function accountLocationPolicy(req: Request) {
  const settings = await getLocationSettings();
  const district = settings.scope === 'district' ? await detectLocationDistrict(req) : undefined;
  return { settings, district, requiresLocation: settings.scope === 'district' && !district };
}

export function policySelection(
  req: Request,
  place: LocationSelectionPayload,
  settings: LocationSettings,
) {
  return {
    ...place,
    policyRevision: settings.revision,
    ...(settings.scope === 'district'
      ? { districtRestricted: true, visitorKey: locationVisitorKey(req) }
      : {}),
  };
}

export async function assertLocationPolicy(
  req: Request,
  proof: LocationSelectionPayload,
  currentSettings?: LocationSettings,
) {
  const settings = currentSettings || (await getLocationSettings());
  if (proof.policyRevision !== undefined && proof.policyRevision !== settings.revision)
    throw new MedicalError(
      'Location settings changed. Search and choose your location again.',
      409,
    );
  if (settings.detail === 'cities' && proof.registrationArea)
    throw new MedicalError('Choose a city from the updated suggestions.', 409);
  if (
    settings.scope === 'district' &&
    (!proof.districtRestricted ||
      !proof.districtKey ||
      proof.visitorKey !== locationVisitorKey(req) ||
      proof.policyRevision !== settings.revision)
  ) {
    throw new MedicalError(
      'Confirm your current location and choose a suggestion in your detected district.',
      409,
    );
  }
}

export async function lockLocationPolicy(
  tx: Prisma.TransactionClient,
  req: Request,
  proof: LocationSelectionPayload | null,
) {
  if (!proof)
    throw new MedicalError('Your location selection expired. Search and choose again.', 409);
  const rows = await tx.$queryRaw<
    Array<{ revision: number; settings: unknown }>
  >`SELECT revision, settings FROM "LocationSettings" WHERE id = 'account-locations' FOR SHARE`;
  if (!rows.length)
    throw new MedicalError('Location settings changed. Search and choose again.', 409);
  await assertLocationPolicy(req, proof, {
    ...LocationSettingsSchema.parse(rows[0].settings),
    revision: rows[0].revision,
  });
}
