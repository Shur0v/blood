"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type SlotKey = "native-ad-1" | "native-ad-2" | "native-ad-3";

type RuntimeAd = {
  id: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc: string | null;
  containerId: string | null;
  slotKey: SlotKey | null;
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
};

type RuntimePayload = {
  adsRuntimeEnabled: boolean;
  adUnits: RuntimeAd[];
};

const BLOCKED_PREFIXES = ["/admin-dashboard", "/dashboard", "/api"];

export default function ManagedNativeAdSlot({ slotKey }: { slotKey: SlotKey }) {
  const pathname = usePathname();
  const [ad, setAd] = useState<RuntimeAd | null>(null);
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
        const payload = await res.json();
        if (!active || !res.ok || !payload?.success) return;
        const data = payload.data as RuntimePayload;
        if (!data.adsRuntimeEnabled) {
          setAd(null);
          return;
        }
        const found =
          data.adUnits.find(
            (item) =>
              item.adType === "native_banner" &&
              item.slotKey === slotKey &&
              item.placement === "hero_center" &&
              item.scriptSrc &&
              item.containerId
          ) || null;
        setAd(found);
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
  }, [shouldHide, slotKey, pathname]);

  useEffect(() => {
    if (!ad?.scriptSrc || !ad?.containerId || shouldHide) {
      document.querySelectorAll(`script[data-bloodnet-native-slot='${slotKey}']`).forEach((el) => el.remove());
      return;
    }
    const existing = document.querySelector(`script[data-bloodnet-native-slot='${slotKey}']`);
    if (existing) return;
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = ad.scriptSrc;
    script.setAttribute("data-bloodnet-native-slot", slotKey);
    script.setAttribute("data-bloodnet-managed-ad", "1");
    document.body.appendChild(script);
  }, [ad?.scriptSrc, ad?.containerId, slotKey, shouldHide]);

  if (shouldHide || !ad?.containerId) return null;

  return (
    <div className="mx-auto my-8 flex max-w-4xl justify-center">
      <div id={ad.containerId} />
    </div>
  );
}
