import { getPublicBotStats } from "@/src/backend/services/seoData";
import { getPublicBaseUrl } from "@/src/backend/config/env";

export async function GET() {
  try {
    const stats = await getPublicBotStats();
    const body = [
      "BloodNet public site state",
      `URL: ${getPublicBaseUrl()}`,
      "Purpose: Free global blood donor, organ donor, and patient connection platform.",
      `Registered active donors: ${stats.registeredDonors}`,
      `Active donor entries: ${stats.activeBloodDonors}`,
      `Active countries: ${stats.activeCountries}`,
      `Active cities: ${stats.activeCities}`,
      `Organ donor entries: ${stats.organDonorEntries}`,
      `Verified organ requests: ${stats.verifiedOrganRequests}`,
      `Public counting policy: ${stats.publicCountingPolicy}`,
      `Last updated: ${stats.lastUpdated}`,
      `Generated at: ${new Date().toISOString()}`,
    ].join("\n");

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch {
    return new Response("Failed to generate public site state.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
