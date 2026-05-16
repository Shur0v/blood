import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from "@/src/backend/utils/session";
import { DEFAULT_AD_UNITS, parseAdUnits } from "@/src/lib/adRuntime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AdUnitSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  provider: z.string().min(1).max(60),
  adType: z.enum(["script", "smartlink", "native_banner", "iframe_banner"]),
  scriptSrc: z.string().url().refine((value) => value.startsWith("https://"), "Script URL must be https.").optional(),
  targetUrl: z.string().url().refine((value) => value.startsWith("https://"), "Target URL must be https.").optional(),
  linkLabel: z.string().min(1).max(120).optional(),
  containerId: z.string().min(1).max(200).optional(),
  slotKey: z.enum(["native-ad-1", "native-ad-2", "native-ad-3"]).optional(),
  bannerKey: z.string().min(1).max(120).optional(),
  bannerWidth: z.number().int().positive().max(1920).optional(),
  bannerHeight: z.number().int().positive().max(1080).optional(),
  enabled: z.boolean(),
  scope: z.literal("all_public_pages"),
  placement: z.enum(["head", "body_end", "footer_inline", "hero_center", "donor_cards_mix", "community_image_slot"]),
  notes: z.string().max(300).optional(),
}).superRefine((val, ctx) => {
  if (val.adType === "script" && !val.scriptSrc) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scriptSrc"], message: "Script URL required for script ad." });
  }
  if (val.adType === "smartlink" && !val.targetUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["targetUrl"], message: "Target URL required for smartlink ad." });
  }
  if (val.adType === "native_banner") {
    if (!val.scriptSrc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scriptSrc"], message: "Script URL required for native banner." });
    }
    if (!val.containerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["containerId"], message: "Container ID required for native banner." });
    }
    if (!val.slotKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slotKey"], message: "Serial slot key required for native banner." });
    }
  }
  if (val.adType === "iframe_banner") {
    if (!val.scriptSrc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scriptSrc"], message: "Script URL required for iframe banner." });
    }
    if (!val.bannerKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerKey"], message: "Banner key required for iframe banner." });
    }
    if (!val.bannerWidth) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerWidth"], message: "Banner width required for iframe banner." });
    }
    if (!val.bannerHeight) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bannerHeight"], message: "Banner height required for iframe banner." });
    }
  }
});

const AdsSettingsSchema = z.object({
  adsRuntimeEnabled: z.boolean(),
  adUnits: z.array(AdUnitSchema).min(1).max(40),
});

const getLatestSettings = async (prisma: ReturnType<typeof getPrisma>) =>
  prisma.platformSettings.findFirst({
    orderBy: [{ updated_at: "desc" }, { id: "desc" }],
  });

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!hasRequiredRole(session, ADMIN_ROLES)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

  try {
    const prisma = getPrisma();
    let settings = await getLatestSettings(prisma);
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          ads_runtime_enabled: true,
          ad_units_json: DEFAULT_AD_UNITS,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        adsRuntimeEnabled: settings.ads_runtime_enabled,
        adUnits: parseAdUnits(settings.ad_units_json),
        updatedAt: settings.updated_at,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load ad settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!hasRequiredRole(session, ADMIN_ROLES)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

  try {
    const parsed = AdsSettingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid ad settings payload." }, { status: 400 });
    }

    const prisma = getPrisma();
    let settings = await getLatestSettings(prisma);
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          ads_runtime_enabled: parsed.data.adsRuntimeEnabled,
          ad_units_json: parsed.data.adUnits,
        },
      });
    } else {
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          ads_runtime_enabled: parsed.data.adsRuntimeEnabled,
          ad_units_json: parsed.data.adUnits,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        adsRuntimeEnabled: settings.ads_runtime_enabled,
        adUnits: parseAdUnits(settings.ad_units_json),
        updatedAt: settings.updated_at,
      },
      message: "Ad settings updated successfully.",
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update ad settings." }, { status: 500 });
  }
}
