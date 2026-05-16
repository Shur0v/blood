import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { DEFAULT_AD_UNITS, parseAdUnits } from "@/src/lib/adRuntime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prisma = getPrisma();
    const settings = await prisma.platformSettings.findFirst({
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
      select: {
        ads_runtime_enabled: true,
        ad_units_json: true,
        updated_at: true,
      },
    });

    const adUnits = parseAdUnits(settings?.ad_units_json || DEFAULT_AD_UNITS)
      .filter((item) => item.enabled)
      .map((item) => ({
        id: item.id,
        adType: item.adType,
        scriptSrc: item.scriptSrc || null,
        targetUrl: item.targetUrl || null,
        linkLabel: item.linkLabel || null,
        containerId: item.containerId || null,
        slotKey: item.slotKey || null,
        bannerKey: item.bannerKey || null,
        bannerWidth: item.bannerWidth || null,
        bannerHeight: item.bannerHeight || null,
        scope: item.scope,
        placement: item.placement,
      }));

    return NextResponse.json({
      success: true,
      data: {
        adsRuntimeEnabled: settings?.ads_runtime_enabled ?? true,
        adUnits,
        updatedAt: settings?.updated_at || null,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load public ad settings." }, { status: 500 });
  }
}
