"use client";

import type { AdsRuntime } from "@/src/lib/adsRuntimeStore";
import usePublicAds from "./usePublicAds";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";


const BLOCKED_PREFIXES = ["/private", "/admin", "/admin-dashboard", "/dashboard", "/api"];


const removeManagedScripts = () => {
  if (typeof document === "undefined") return;
  document.querySelectorAll("script[data-bloodnet-ad-id]").forEach((el) => el.remove());
};

export default function GlobalManagedAdsRuntime() {
  const pathname = usePathname();
  const config = usePublicAds();


  const shouldHide = useMemo(
    () => BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  useEffect(() => {
    if (window.self !== window.top && new URLSearchParams(window.location.search).get('heatmapPreview') === '1') return;
    if (shouldHide) {
      removeManagedScripts();
      return;
    }

    const syncAds = (payload: AdsRuntime | null) => {
      if (!payload || !payload.adsRuntimeEnabled) {
        removeManagedScripts();
        return;
      }

      const desired = new Set(payload.adUnits.filter(unit => unit.adType === 'script').map((unit) => unit.id));

      document.querySelectorAll("script[data-bloodnet-ad-id]").forEach((node) => {
        const id = (node as HTMLScriptElement).dataset.bloodnetAdId || "";
        if (!desired.has(id)) node.remove();
      });

      for (const ad of payload.adUnits) {
        if (ad.adType !== "script" || !ad.scriptSrc) continue;
        const exists = document.querySelector(`script[data-bloodnet-ad-id='${ad.id}']`);
        if (exists?.getAttribute('src') === ad.scriptSrc) continue;
        exists?.remove();
        const script = document.createElement("script");
        script.src = ad.scriptSrc;
        script.async = true;
        script.type = "text/javascript";
        script.setAttribute("data-bloodnet-managed-ad", "1");
        script.setAttribute("data-bloodnet-ad-id", ad.id);
        script.setAttribute("data-cfasync", "false");
        if (ad.placement === "body_end") {
          document.body.appendChild(script);
        } else {
          document.head.appendChild(script);
        }
      }
    };

    syncAds(config);
  }, [shouldHide, config]);

  useEffect(() => removeManagedScripts, []);

  useEffect(() => {
    if (shouldHide && config) removeManagedScripts();
  }, [config, shouldHide]);

  return null;
}
