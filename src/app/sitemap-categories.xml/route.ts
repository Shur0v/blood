import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();

  const routes = [
    "/organ/donor",
    "/organ/request",
    "/organ/registry",
    "/register-donor",
    "/request-blood",
    "/request-organ",


    "/emergency-blood-help",
    "/medical-disclaimer",
    "/organ-donation-ethics",
    "/how-it-works",
    "/safety-policy",


  ];

  return renderUrlSetXml(routes.map((path) => ({ url: `${baseUrl}${path}` })));
}
