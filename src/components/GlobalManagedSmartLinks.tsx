"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type RuntimeAd = {
  id: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc: string | null;
  targetUrl: string | null;
  linkLabel: string | null;
  scope: "all_public_pages";
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
};

type RuntimePayload = {
  adsRuntimeEnabled: boolean;
  adUnits: RuntimeAd[];
  updatedAt: string | null;
};

const BLOCKED_PREFIXES = ["/admin-dashboard", "/dashboard", "/api"];

export default function GlobalManagedSmartLinks() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<RuntimePayload | null>(null);
  const shouldHide = useMemo(
    () => BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  useEffect(() => {
    if (shouldHide) return;
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/public/ads-settings", { method: "GET", cache: "no-store" });
        const data = await res.json();
        if (!active || !res.ok || !data?.success) return;
        setPayload(data.data as RuntimePayload);
      } catch {
        // ignore
      }
    };
    void load();
    const t = window.setInterval(() => void load(), 3000);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [shouldHide, pathname]);

  if (shouldHide || !payload?.adsRuntimeEnabled) return null;

  const smartLinks = payload.adUnits.filter(
    (ad) => ad.adType === "smartlink" && ad.placement === "footer_inline" && ad.targetUrl
  );
  if (smartLinks.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-0 pt-0" aria-label="Sponsored links">
      <div className="rounded-[8px] border border-white/10 bg-black px-3 py-1 text-center text-xs text-gray-400">
        <span className="mr-2 font-semibold uppercase tracking-wide text-gray-500">Sponsored</span>
        {smartLinks.map((ad) => (
          <a
            key={ad.id}
            href={ad.targetUrl!}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="mr-3 inline-block font-bold text-red-400 underline-offset-2 hover:underline"
          >
            {ad.linkLabel || "Visit Partner"}
          </a>
        ))}
      </div>
    </section>
  );
}
