"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const [adsRuntimeEnabled, setAdsRuntimeEnabled] = useState(true);
  const shouldHide = BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    const loadAdRuntime = async () => {
      try {
        const res = await fetch("/api/public/ads-settings", { method: "GET", cache: "no-store" });
        const payload = await res.json();
        if (!res.ok || !payload?.success) return;
        setAdsRuntimeEnabled(Boolean(payload?.data?.adsRuntimeEnabled));
      } catch {
        // ignore temporary failures
      }
    };
    void loadAdRuntime();
    const timer = window.setInterval(() => void loadAdRuntime(), 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (shouldHide || !adsRuntimeEnabled || pushedRef.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // AdSense may be blocked by browser extensions or unavailable during review.
    }
  }, [shouldHide]);

  if (shouldHide || !adsRuntimeEnabled) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8" aria-label="Sponsored content">
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
