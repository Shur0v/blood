export const ORGAN_CATALOG = [
  "Kidney",
  "Liver",
  "Lung",
  "Pancreas",
  "Intestine",
  "Eye",
  "Sperm",
] as const;

export type CanonicalOrgan = (typeof ORGAN_CATALOG)[number];

const ORGAN_ALIAS_MAP: Record<string, CanonicalOrgan | null> = {
  kidney: "Kidney",
  kidneys: "Kidney",
  liver: "Liver",
  lung: "Lung",
  lungs: "Lung",
  pancreas: "Pancreas",
  intestine: "Intestine",
  "small intestine": "Intestine",
  eye: "Eye",
  eyes: "Eye",
  cornea: "Eye",
  corneas: "Eye",
  "corneas (eyes)": "Eye",
  sperm: "Sperm",
  sparm: "Sperm",
  semen: "Sperm",

  heart: null,
  brain: null,
  "skin tissue": null,
};

export const normalizeOrganName = (value: string): CanonicalOrgan | null => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized in ORGAN_ALIAS_MAP) {
    return ORGAN_ALIAS_MAP[normalized];
  }
  return null;
};

export const normalizeOrganList = (values: string[]): CanonicalOrgan[] => {
  const unique = new Set<CanonicalOrgan>();
  for (const value of values) {
    const canonical = normalizeOrganName(value);
    if (canonical) unique.add(canonical);
  }
  return Array.from(unique);
};

export const isAllowedOrgan = (value: string): boolean => {
  return normalizeOrganName(value) !== null;
};
