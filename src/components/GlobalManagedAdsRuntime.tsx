"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type RuntimeAd = {
  id: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc: string | null;
  targetUrl: string | null;
  linkLabel: string | null;
  containerId?: string | null;
  slotKey?: "native-ad-1" | "native-ad-2" | "native-ad-3" | null;
  scope: "all_public_pages";
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
};

type RuntimePayload = {
  adsRuntimeEnabled: boolean;
  adUnits: RuntimeAd[];
  updatedAt: string | null;
};

const BLOCKED_PREFIXES = ["/admin-dashboard", "/dashboard", "/api"];
const REFRESH_MS = 3000;

const removeManagedScripts = () => {
  if (typeof document === "undefined") return;
  document.querySelectorAll("script[data-bloodnet-managed-ad='1']").forEach((el) => el.remove());
};

export default function GlobalManagedAdsRuntime() {
  const pathname = usePathname();
  const [config, setConfig] = useState<RuntimePayload | null>(null);
  const loadingRef = useRef(false);

  const shouldHide = useMemo(
    () => BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  useEffect(() => {
    if (shouldHide) {
      removeManagedScripts();
      return;
    }

    const syncAds = (payload: RuntimePayload | null) => {
      if (!payload || !payload.adsRuntimeEnabled) {
        removeManagedScripts();
        return;
      }

      const desired = new Set(payload.adUnits.map((unit) => unit.id));

      document.querySelectorAll("script[data-bloodnet-managed-ad='1']").forEach((node) => {
        const id = (node as HTMLScriptElement).dataset.bloodnetAdId || "";
        if (!desired.has(id)) node.remove();
      });

      for (const ad of payload.adUnits) {
        if (ad.adType !== "script" || !ad.scriptSrc) continue;
        const exists = document.querySelector(`script[data-bloodnet-ad-id='${ad.id}']`);
        if (exists) continue;
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

    const loadConfig = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        const res = await fetch("/api/public/ads-settings", {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (!res.ok || !payload?.success) return;
        const next = payload.data as RuntimePayload;
        setConfig(next);
        syncAds(next);
      } catch {
        // ignore transient failures
      } finally {
        loadingRef.current = false;
      }
    };

    void loadConfig();
    const timer = window.setInterval(() => {
      void loadConfig();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadConfig();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [shouldHide, pathname]);

  useEffect(() => {
    if (shouldHide && config) removeManagedScripts();
  }, [config, shouldHide]);

  return null;
}
