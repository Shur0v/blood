import type { Prisma } from '@prisma/client';
import { normalizeLocation } from './neighborhoods';
import { getPrisma } from '@/src/backend/config/db';

export const MAX_SERVICE_CITIES = 5;
const LOCK_DAYS = 30;

export interface ServiceCityInput {
  city: string;
  country: string;
  formatted_location: string;
  latitude: number;
  longitude: number;
  provider_place_id: string;
}

export const buildLockedUntil = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + LOCK_DAYS * 24 * 60 * 60 * 1000);
};

export const listServiceCities = async (userId: string, client: Pick<Prisma.TransactionClient, 'userServiceCity'> = getPrisma()) => {
  const rows = await client.userServiceCity.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });

  const now = Date.now();
  return rows.map((row) => {
    const msLeft = row.locked_until.getTime() - now;
    const daysLeft = msLeft > 0 ? Math.ceil(msLeft / (24 * 60 * 60 * 1000)) : 0;
    return {
      id: row.id,
      city: row.city,
      country: row.country,
      formatted_location: row.formatted_location,
      latitude: row.lat,
      longitude: row.lng,
      provider_place_id: row.provider_place_id,
      registrationArea: row.neighborhood_name && row.neighborhood_place_id
        ? { name: row.neighborhood_name, placeId: row.neighborhood_place_id } : undefined,
      locked_until: row.locked_until,
      canRemove: msLeft <= 0,
      remainingDays: daysLeft,
      created_at: row.created_at,
    };
  });
};

export async function lockPrimaryLocation(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
  return tx.user.findUniqueOrThrow({ where: { id: userId } });
}

export function neighborhoodReset(current: { location_city: string; location_country: string }, city?: string, country?: string) {
  const changed = (city !== undefined && normalizeLocation(city) !== normalizeLocation(current.location_city)) ||
    (country !== undefined && normalizeLocation(country) !== normalizeLocation(current.location_country));
  return changed ? { registration_area: null, registration_area_place_id: null } : {};
}

export const syncLegacyLocationFromFirstCity = async (userId: string, tx: Prisma.TransactionClient, useNeighborhood = false) => {
  const current = await lockPrimaryLocation(tx, userId);
  const first = await tx.userServiceCity.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });
  if (!first) return;

  await tx.user.update({
    where: { id: userId },
    data: {
      ...neighborhoodReset(current, first.city, first.country),
      ...(useNeighborhood || first.neighborhood_name ? {
        registration_area: first.neighborhood_name,
        registration_area_place_id: first.neighborhood_place_id,
      } : {}),
      location_city: first.city,
      location_country: first.country,
      location_formatted: first.formatted_location,
      location_lat: first.lat,
      location_lng: first.lng,
      place_id: first.provider_place_id,
    },
  });
};
