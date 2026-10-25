import { getPublicBaseUrl } from "@/src/backend/config/env";

const EXTRA_SITEMAPS = [
  "sitemap-main.xml",
  "sitemap-categories.xml",
  "sitemap-regions.xml",
  "sitemap-blog.xml",
  "sitemap-images.xml",
  "sitemap-location.xml",
  "sitemap-guides.xml",
  "sitemap-network.xml",
  "sitemap-donors.xml",
];

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const all = ["sitemap.xml", ...EXTRA_SITEMAPS];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (name) => `  <sitemap>
    <loc>${baseUrl}/${name}</loc>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
