"use client";

import usePublicAds from "./usePublicAds";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

type SlotKey = "native-ad-1" | "native-ad-2" | "native-ad-3";


const BLOCKED_PREFIXES = ["/private", "/admin", "/admin-dashboard", "/dashboard", "/api"];

export default function ManagedNativeAdSlot({ slotKey }: { slotKey: SlotKey }) {
  const pathname = usePathname();
  const config = usePublicAds();
  const shouldHide = useMemo(
    () => BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  const ad = useMemo(() => !shouldHide && config?.adsRuntimeEnabled ? config.adUnits.find(item => item.adType === 'native_banner' && item.slotKey === slotKey && item.placement === 'hero_center' && item.scriptSrc && item.containerId) || null : null, [shouldHide, config, slotKey]);

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
    return () => script.remove();
  }, [ad?.scriptSrc, ad?.containerId, slotKey, shouldHide]);

  if (shouldHide || !ad?.containerId) return null;

  return (
    <div className="mx-auto my-8 flex max-w-4xl justify-center">
      <div id={ad.containerId} />
    </div>
  );
}
