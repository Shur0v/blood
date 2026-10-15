import { NextResponse } from "next/server";
import { getPublicBotStats } from "@/src/backend/services/seoData";
import { getPublicBaseUrl } from "@/src/backend/config/env";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publicNetwork = await getPublicBotStats();
    return NextResponse.json(
      {
        name: "BloodNet",
        url: getPublicBaseUrl(),
        description:
          "Free global blood donor, organ donor, and patient connection platform.",
        dataPolicy:
          publicNetwork.publicCountingPolicy,
        publicNetwork,
        generatedAt: new Date().toISOString(),
        lastUpdated: publicNetwork.lastUpdated,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to generate public site state." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
