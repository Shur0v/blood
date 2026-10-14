"use client";

import usePublicAds from "./usePublicAds";
import Script from "next/script";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";


declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT = "ca-pub-6276589710687942";
const AD_SLOT = "9256247950";

const BLOCKED_PREFIXES = [
  "/admin-dashboard",
  "/dashboard",
  "/api",
  "/login",
  "/register",
  "/user",
  "/account",
  "/settings",
  "/private",
  "/checkout",
  "/payment",
  "/success",
  "/failed",
];

export default function GlobalAdSenseSlot() {
  const pathname = usePathname();
  const pushedRef = useRef(false);
  const adsRuntimeEnabled = Boolean(usePublicAds()?.adsRuntimeEnabled);
  const shouldHide = BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));



  useEffect(() => {
    if (shouldHide || !adsRuntimeEnabled || pushedRef.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // AdSense may be blocked by browser extensions or unavailable during review.
    }
  }, [shouldHide, adsRuntimeEnabled]);

  if (shouldHide || !adsRuntimeEnabled) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8" aria-label="Sponsored content">
      <Script id="bloodnet-adsense" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`} strategy="afterInteractive" crossOrigin="anonymous" />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}
