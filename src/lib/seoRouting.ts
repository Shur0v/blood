import { toLocationSlug, fromLocationSlug } from "@/src/backend/utils/locationSlug";
import { normalizeOrganName, type CanonicalOrgan } from "@/src/lib/organCatalog";

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const BLOOD_GROUP_TO_SLUG: Record<BloodGroup, string> = {
  "O+": "o-positive",
  "O-": "o-negative",
  "A+": "a-positive",
  "A-": "a-negative",
  "B+": "b-positive",
  "B-": "b-negative",
  "AB+": "ab-positive",
  "AB-": "ab-negative",
};

export const SLUG_TO_BLOOD_GROUP = Object.fromEntries(
  BLOOD_GROUPS.map((group) => [BLOOD_GROUP_TO_SLUG[group], group]),
) as Record<string, BloodGroup>;

export const bloodGroupFromSlug = (slug: string): BloodGroup | null =>
  SLUG_TO_BLOOD_GROUP[slug.toLowerCase()] ?? null;

export const bloodGroupToSlug = (group: string): string | null => {
  const normalized = group.toUpperCase().replace(/\s+/g, "") as BloodGroup;
  return BLOOD_GROUP_TO_SLUG[normalized] ?? null;
};

export const bloodGroupReadable = (group: string): string => group.toUpperCase().replace(/\s+/g, "");

const ORGAN_SLUG_TO_NAME: Record<string, CanonicalOrgan> = {
  kidney: "Kidney",
  liver: "Liver",
  lung: "Lung",
  pancreas: "Pancreas",
  intestine: "Intestine",
  eye: "Eye",
  cornea: "Eye",
  sperm: "Sperm",
};

export const organFromSlug = (slug: string): CanonicalOrgan | null =>
  ORGAN_SLUG_TO_NAME[slug.toLowerCase()] ?? normalizeOrganName(fromLocationSlug(slug));

export const organToSlug = (organ: string): string | null => {
  const normalized = normalizeOrganName(organ);
  if (!normalized) return null;
  return normalized === "Eye" ? "cornea" : toLocationSlug(normalized);
};

export const COUNTRY_SHORTCUTS: Record<string, string> = {
  bd: "Bangladesh",
  in: "India",
  sg: "Singapore",
  ph: "Philippines",
  us: "United States",
  uk: "United Kingdom",
  ca: "Canada",
  au: "Australia",
};

export const countryToShortcut = (country: string): string | null => {
  const target = country.trim().toLowerCase();
  const found = Object.entries(COUNTRY_SHORTCUTS).find(([, name]) => name.toLowerCase() === target);
  return found?.[0] ?? null;
};

export const cityToSlug = toLocationSlug;
export const cityFromSlug = fromLocationSlug;

export const maskPublicPhone = (value: string | null | undefined): string => {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "Contact through platform";
  if (digits.length <= 4) return "Contact hidden";
  return `${value?.startsWith("+") ? "+" : ""}${digits.slice(0, 3)}...${digits.slice(-3)}`;
};

export const jsonLdScript = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});

export const absoluteUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
