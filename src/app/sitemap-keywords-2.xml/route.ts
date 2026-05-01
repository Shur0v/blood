import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getKeywordLandingChunk } from "@/src/lib/sitemapChunks";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const chunk = getKeywordLandingChunk(1);
  return renderUrlSetXml(chunk.map((entry) => ({ url: `${baseUrl}/keywords/${entry.slug}` })));
}
