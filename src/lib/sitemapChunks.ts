import { KEYWORD_LANDINGS } from "@/src/lib/keywordLandings";
import { REGIONS } from "@/src/lib/regions";

export const KEYWORD_SITEMAP_CHUNK_SIZE = 120;

export const chunkKeywordLandings = () => {
  const chunks: Array<typeof KEYWORD_LANDINGS> = [];
  for (let i = 0; i < KEYWORD_LANDINGS.length; i += KEYWORD_SITEMAP_CHUNK_SIZE) {
    chunks.push(KEYWORD_LANDINGS.slice(i, i + KEYWORD_SITEMAP_CHUNK_SIZE));
  }
  return chunks;
};

export const REGION_SLUGS = REGIONS.map((region) => region.slug);
