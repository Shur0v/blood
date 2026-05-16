export type ManagedAdUnit = {
  id: string;
  name: string;
  provider: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc?: string;
  targetUrl?: string;
  linkLabel?: string;
  containerId?: string;
  slotKey?: "native-ad-1" | "native-ad-2" | "native-ad-3";
  bannerKey?: string;
  bannerWidth?: number;
  bannerHeight?: number;
  enabled: boolean;
  scope: "all_public_pages";
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
  notes?: string;
};

export type PublicAdRuntimeConfig = {
  adsRuntimeEnabled: boolean;
  adUnits: ManagedAdUnit[];
  updatedAt: string | null;
};

export const DEFAULT_AD_UNITS: ManagedAdUnit[] = [
  {
    id: "adsterra-popunder-main",
    name: "Adsterra Popunder Main",
    provider: "Adsterra",
    adType: "script",
    scriptSrc: "https://pl29469463.effectivecpmnetwork.com/2b/0b/9f/2b0b9f621959ee748ba9a30128ad5f7e.js",
    enabled: true,
    scope: "all_public_pages",
    placement: "head",
    notes: "Global public-page popunder script",
  },
  {
    id: "adsterra-social-bar-main",
    name: "Adsterra Social Bar Main",
    provider: "Adsterra",
    adType: "script",
    scriptSrc: "https://pl29469454.effectivecpmnetwork.com/07/db/fd/07dbfdd21c5e3c93f21a813d1479f50a.js",
    enabled: true,
    scope: "all_public_pages",
    placement: "body_end",
    notes: "Global public-page social bar script",
  },
  {
    id: "adsterra-smartlink-main",
    name: "Adsterra Smartlink Main",
    provider: "Adsterra",
    adType: "smartlink",
    targetUrl: "https://www.effectivecpmnetwork.com/r175cucc?key=fbe2ac46345c777993c12b43f45187de",
    linkLabel: "Sponsored Offer",
    enabled: true,
    scope: "all_public_pages",
    placement: "footer_inline",
    notes: "Global smartlink placement",
  },
  {
    id: "adsterra-native-banner-1",
    name: "Adsterra Native Banner 1",
    provider: "Adsterra",
    adType: "native_banner",
    scriptSrc: "https://pl29469456.effectivecpmnetwork.com/8887b1dc3c89b47d01afc025c7cdc1d8/invoke.js",
    containerId: "container-8887b1dc3c89b47d01afc025c7cdc1d8",
    slotKey: "native-ad-1",
    enabled: true,
    scope: "all_public_pages",
    placement: "hero_center",
    notes: "Hero center native unit (serial native-ad-1)",
  },
  {
    id: "hpf-inline-banner-320x50-1",
    name: "HPF Inline Banner 320x50",
    provider: "HighPerformanceFormat",
    adType: "iframe_banner",
    scriptSrc: "https://www.highperformanceformat.com/235657d54be01bcad957c1707157191a/invoke.js",
    bannerKey: "235657d54be01bcad957c1707157191a",
    bannerWidth: 320,
    bannerHeight: 50,
    enabled: true,
    scope: "all_public_pages",
    placement: "donor_cards_mix",
    notes: "Mixed donor card slot banner (320x50)",
  },
  {
    id: "hpf-community-image-300x250-1",
    name: "HPF Community Image Banner 300x250",
    provider: "HighPerformanceFormat",
    adType: "iframe_banner",
    scriptSrc: "https://www.highperformanceformat.com/b461cb4f658f1994fd6dc7b4b7f7ebb6/invoke.js",
    bannerKey: "b461cb4f658f1994fd6dc7b4b7f7ebb6",
    bannerWidth: 300,
    bannerHeight: 250,
    enabled: true,
    scope: "all_public_pages",
    placement: "community_image_slot",
    notes: "Replace community promo image with ad when enabled",
  },
];

const normalizeAdUnit = (input: unknown): ManagedAdUnit | null => {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const id = String(row.id || "").trim();
  const name = String(row.name || "").trim();
  const provider = String(row.provider || "").trim();
  const adType =
    row.adType === "smartlink"
      ? "smartlink"
      : row.adType === "script"
        ? "script"
        : row.adType === "native_banner"
          ? "native_banner"
          : row.adType === "iframe_banner"
            ? "iframe_banner"
            : null;
  const scriptSrc = String(row.scriptSrc || "").trim();
  const targetUrl = String(row.targetUrl || "").trim();
  const linkLabel = String(row.linkLabel || "").trim();
  const containerId = String(row.containerId || "").trim();
  const slotKey = row.slotKey === "native-ad-1" || row.slotKey === "native-ad-2" || row.slotKey === "native-ad-3" ? row.slotKey : undefined;
  const bannerKey = String(row.bannerKey || "").trim();
  const bannerWidth = Number(row.bannerWidth || 0);
  const bannerHeight = Number(row.bannerHeight || 0);
  const enabled = Boolean(row.enabled);
  const scope = row.scope === "all_public_pages" ? "all_public_pages" : null;
  const placement =
    row.placement === "head" ||
    row.placement === "body_end" ||
    row.placement === "footer_inline" ||
    row.placement === "hero_center" ||
    row.placement === "donor_cards_mix" ||
    row.placement === "community_image_slot"
      ? row.placement
      : null;
  const notes = typeof row.notes === "string" ? row.notes.trim() : "";

  if (!id || !name || !provider || !adType || !scope || !placement) return null;
  if (adType === "script") {
    if (!scriptSrc || !/^https:\/\//i.test(scriptSrc)) return null;
  }
  if (adType === "smartlink") {
    if (!targetUrl || !/^https:\/\//i.test(targetUrl)) return null;
  }
  if (adType === "native_banner") {
    if (!scriptSrc || !/^https:\/\//i.test(scriptSrc)) return null;
    if (!containerId) return null;
  }
  if (adType === "iframe_banner") {
    if (!scriptSrc || !/^https:\/\//i.test(scriptSrc)) return null;
    if (!bannerKey) return null;
    if (!Number.isFinite(bannerWidth) || bannerWidth <= 0) return null;
    if (!Number.isFinite(bannerHeight) || bannerHeight <= 0) return null;
  }

  return {
    id,
    name,
    provider,
    adType,
    ...(scriptSrc ? { scriptSrc } : {}),
    ...(targetUrl ? { targetUrl } : {}),
    ...(linkLabel ? { linkLabel } : {}),
    ...(containerId ? { containerId } : {}),
    ...(slotKey ? { slotKey } : {}),
    ...(bannerKey ? { bannerKey } : {}),
    ...(bannerWidth > 0 ? { bannerWidth } : {}),
    ...(bannerHeight > 0 ? { bannerHeight } : {}),
    enabled,
    scope,
    placement,
    notes: notes || undefined,
  };
};

export const parseAdUnits = (raw: unknown): ManagedAdUnit[] => {
  if (!Array.isArray(raw)) return DEFAULT_AD_UNITS;
  const parsed = raw
    .map((item) => normalizeAdUnit(item))
    .filter((item): item is ManagedAdUnit => Boolean(item));
  if (parsed.length === 0) return DEFAULT_AD_UNITS;
  return parsed;
};
