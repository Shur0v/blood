import { getPublicBaseUrl } from "@/src/backend/config/env";
import { REGION_SLUGS } from "@/src/lib/sitemapChunks";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const now = new Date();
  return renderUrlSetXml(
    REGION_SLUGS.map((slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified: now,
    }))
  );
}
