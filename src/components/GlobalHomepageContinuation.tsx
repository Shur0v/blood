"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HomeExperience } from "@/src/app/page";

const EXCLUDED_PREFIXES = ["/api", "/admin-dashboard", "/dashboard"];
const EXCLUDED_EXACT = new Set(["/", "/bd", "/in", "/sg", "/ph", "/us", "/uk", "/ca", "/au"]);

export default function GlobalHomepageContinuation() {
  const pathname = usePathname();

  const shouldRender = useMemo(() => {
    if (EXCLUDED_EXACT.has(pathname)) return false;
    if (EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
    return true;
  }, [pathname]);

  if (!shouldRender) return null;

  return (
    <section aria-label="Full BloodNet homepage experience" className="mt-10 border-t border-white/20 pt-8">
      <HomeExperience />
    </section>
  );
}
