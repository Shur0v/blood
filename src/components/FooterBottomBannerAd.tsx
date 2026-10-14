"use client";

import usePublicAds from "./usePublicAds";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";


export default function FooterBottomBannerAd() {
  const adsConfig = usePublicAds();
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
    const data = adsConfig;
    if (!data?.adsRuntimeEnabled || shouldHide) { setAd(null); return; }
    (() => {
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
    })();
  }, [adsConfig, shouldHide]);

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
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const rawSrc = iframe?.getAttribute("src")?.trim() || "";
      const srcLooksValid =
        rawSrc.length > 0 &&
        rawSrc !== "about:blank" &&
        rawSrc !== "about:srcdoc";
      const hasRenderableSize = Boolean(
        iframe && iframe.clientWidth > 0 && iframe.clientHeight > 0
      );
      const ok = Boolean(iframe && srcLooksValid && hasRenderableSize);
      setHasFrame(ok);
      if (!ok) {
        container.innerHTML = "";
      }
    }, 2200);
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
