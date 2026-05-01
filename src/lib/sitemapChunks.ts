import { KEYWORD_LANDINGS } from "@/src/lib/keywordLandings";
import { REGIONS } from "@/src/lib/regions";

export const KEYWORD_SITEMAP_PARTS = 4;

export const getKeywordLandingChunk = (partIndex: number, totalParts = KEYWORD_SITEMAP_PARTS) => {
  const normalizedParts = Math.max(1, totalParts);
  const size = Math.ceil(KEYWORD_LANDINGS.length / normalizedParts);
  const start = partIndex * size;
  const end = start + size;
  return KEYWORD_LANDINGS.slice(start, end);
};

export const REGION_SLUGS = REGIONS.map((region) => region.slug);
