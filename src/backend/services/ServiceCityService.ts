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

export const listServiceCities = async (userId: string) => {
  const rows = await getPrisma().userServiceCity.findMany({
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
      locked_until: row.locked_until,
      canRemove: msLeft <= 0,
      remainingDays: daysLeft,
      created_at: row.created_at,
    };
  });
};

export const syncLegacyLocationFromFirstCity = async (userId: string) => {
  const first = await getPrisma().userServiceCity.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });
  if (!first) return;

  await getPrisma().user.update({
    where: { id: userId },
    data: {
      location_city: first.city,
      location_country: first.country,
      location_formatted: first.formatted_location,
      location_lat: first.lat,
      location_lng: first.lng,
      place_id: first.provider_place_id,
    },
  });
};
