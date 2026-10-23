"use client";

import usePublicAds from "./usePublicAds";

import { useMemo } from "react";
import { usePathname } from "next/navigation";


const BLOCKED_PREFIXES = ["/private", "/admin", "/admin-dashboard", "/dashboard", "/api"];

export default function GlobalManagedSmartLinks() {
  const pathname = usePathname();
  const payload = usePublicAds();
  const shouldHide = useMemo(
    () => BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );



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
