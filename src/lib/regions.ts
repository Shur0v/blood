export type RegionConfig = {
  slug: string;
  country: string;
  label: string;
};

export const REGIONS: RegionConfig[] = [
  { slug: "india", country: "India", label: "India" },
  { slug: "pakistan", country: "Pakistan", label: "Pakistan" },
  { slug: "nepal", country: "Nepal", label: "Nepal" },
  { slug: "bangladesh", country: "Bangladesh", label: "Bangladesh" },
];

export const getRegionBySlug = (slug: string): RegionConfig | null => {
  const normalized = slug.trim().toLowerCase();
  return REGIONS.find((region) => region.slug === normalized) || null;
};
