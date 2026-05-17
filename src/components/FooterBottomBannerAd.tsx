"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type RuntimeAd = {
  id: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc?: string | null;
  bannerKey?: string | null;
  bannerWidth?: number | null;
  bannerHeight?: number | null;
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
};

type RuntimePayload = {
  adsRuntimeEnabled: boolean;
  adUnits: RuntimeAd[];
};

export default function FooterBottomBannerAd() {
  const pathname = usePathname();
  const [ad, setAd] = useState<{
    id: string;
    scriptSrc: string;
    bannerKey: string;
    bannerWidth: number;
    bannerHeight: number;
  } | null>(null);
  const [hasFrame, setHasFrame] = useState(false);
  const shouldHide = useMemo(
    () => pathname.startsWith("/admin-dashboard") || pathname.startsWith("/dashboard") || pathname.startsWith("/api"),
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
        const found = data.adUnits.find(
          (item) =>
            item.adType === "iframe_banner" &&
            item.placement === "footer_inline" &&
            item.scriptSrc &&
            item.bannerKey &&
            Number(item.bannerWidth) > 0 &&
            Number(item.bannerHeight) > 0
        );
        if (!found) {
          setAd(null);
          setHasFrame(false);
          return;
        }
        setAd({
          id: String(found.id),
          scriptSrc: String(found.scriptSrc),
          bannerKey: String(found.bannerKey),
          bannerWidth: Number(found.bannerWidth),
          bannerHeight: Number(found.bannerHeight),
        });
      } catch {
        // ignore transient issues
      }
    };
    void load();
    const t = window.setInterval(() => void load(), 8000);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [shouldHide]);

  useEffect(() => {
    if (shouldHide || !ad) return;
    const container = document.getElementById("footer-bottom-inline-ad");
    if (!container) return;
    container.innerHTML = "";
    setHasFrame(false);
    (window as Window & { atOptions?: unknown }).atOptions = {
      key: ad.bannerKey,
      format: "iframe",
      height: ad.bannerHeight,
      width: ad.bannerWidth,
      params: {},
    };
    const script = document.createElement("script");
    script.src = ad.scriptSrc;
    script.async = false;
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-bloodnet-footer-banner", ad.id);
    container.appendChild(script);
    const checkTimer = window.setTimeout(() => {
      const ok = Boolean(container.querySelector("iframe"));
      setHasFrame(ok);
    }, 1800);
    return () => {
      window.clearTimeout(checkTimer);
      container.innerHTML = "";
      setHasFrame(false);
    };
  }, [ad, shouldHide]);

  if (shouldHide || !ad) {
    return null;
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 ${hasFrame ? "pb-2 pt-1" : "pb-0 pt-0"}`} aria-label="Sponsored banner">
      <div className="flex justify-center">
        <div id="footer-bottom-inline-ad" style={{ width: `${ad.bannerWidth}px`, minHeight: hasFrame ? `${ad.bannerHeight}px` : "0px" }} />
      </div>
    </section>
  );
}
