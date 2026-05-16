"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CONTAINER_ID = "container-69f76ca337dbb9f04681328e3e20bb15";
const SCRIPT_SRC = "https://www.highperformanceformat.com/69f76ca337dbb9f04681328e3e20bb15/invoke.js";

export default function FooterBottomBannerAd() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin-dashboard") || pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) return;

    (window as Window & { atOptions?: unknown }).atOptions = {
      key: "69f76ca337dbb9f04681328e3e20bb15",
      format: "iframe",
      height: 90,
      width: 728,
      params: {},
    };

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-bloodnet-footer-banner", "1");
    document.body.appendChild(script);
  }, [pathname]);

  if (pathname.startsWith("/admin-dashboard") || pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-8" aria-label="Sponsored banner">
      <div className="flex justify-center">
        <div id={CONTAINER_ID} />
      </div>
    </section>
  );
}

