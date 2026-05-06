import { getPrisma } from "@/src/backend/config/db";
import { getSiteContent } from "@/src/backend/services/policyContent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getSiteContent(getPrisma());
    const body = [
      "BloodNet public policy summary",
      "URL: https://bloodnet.live",
      "",
      "Privacy policy:",
      "https://bloodnet.live/privacy",
      "https://bloodnet.live/privacy-policy",
      "",
      "Terms:",
      "https://bloodnet.live/terms",
      "",
      "Safety policy:",
      "https://bloodnet.live/safety-policy",
      "https://bloodnet.live/medical-disclaimer",
      "https://bloodnet.live/organ-donation-ethics",
      "",
      "Privacy summary:",
      content.privacySummary,
      "",
      "Full privacy policy:",
      content.privacyPolicyFull,
      "",
      "Terms and conditions:",
      content.termsOfService,
      "",
      `Last updated: ${content.updatedAt || new Date().toISOString()}`,
    ].join("\n");

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch {
    return new Response(
      [
        "BloodNet public policy summary",
        "Privacy policy: https://bloodnet.live/privacy",
        "Terms: https://bloodnet.live/terms",
        "BloodNet does not sell personal data. BloodNet is a connection platform only and does not provide medical treatment, ambulance service, blood bank inventory confirmation, or legal transplant approval.",
      ].join("\n"),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      },
    );
  }
}
