import { z } from 'zod';

export const LocationSettingsSchema = z
  .object({
    detail: z.enum(['detailed', 'cities']).default('detailed'),
    scope: z.enum(['country', 'district']).default('country'),
    nearbyFirst: z.boolean().default(true),
    typoSuggestions: z.boolean().default(true),
    countryInLabel: z.boolean().default(false),
  })
  .strict();

export type LocationSettings = z.infer<typeof LocationSettingsSchema> & { revision: number };
export const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
  ...LocationSettingsSchema.parse({}),
  revision: 1,
};
export const LOCATION_SETTINGS_EVENT = 'bloodnet-location-settings';

export type LocationLabel = {
  city: string;
  country: string;
  district?: string;
  state?: string;
  registrationArea?: { name: string };
  corrected?: boolean;
};
const unique = (values: Array<string | undefined>) => [
  ...new Map(values.filter(Boolean).map((value) => [value!.toLowerCase(), value!])).values(),
];
export function locationLabel(item: LocationLabel, countryInLabel = false) {
  return unique([
    item.registrationArea?.name,
    item.city,
    countryInLabel ? item.country : undefined,
  ]).join(', ');
}
export function locationContextLabel(item: LocationLabel) {
  const mainNames = [item.city, item.registrationArea?.name]
    .filter(Boolean)
    .map((name) => name!.toLowerCase());
  return unique([
    ...[item.district, item.state].filter(
      (name) => name && !mainNames.includes(name.toLowerCase()),
    ),
    item.country,
  ]).join(' · ');
}
