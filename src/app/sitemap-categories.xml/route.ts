import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const now = new Date();
  const routes = [
    "/organ/donor",
    "/organ/request",
    "/organ/registry",
    "/register-donor",
    "/request-blood",
    "/request-organ",
    "/blood-donation-guide",
    "/organ-donation-guide",
    "/emergency-blood-help",
    "/medical-disclaimer",
    "/organ-donation-ethics",
    "/how-it-works",
    "/safety-policy",
    "/privacy-policy",
    "/policy.txt",
  ];

  return renderUrlSetXml(routes.map((path) => ({ url: `${baseUrl}${path}`, lastModified: now })));
}
