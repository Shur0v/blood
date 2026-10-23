"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HomeExperience } from "@/src/components/HomeExperience";
import { useEffect, useState } from 'react';
import { isDiscoveryPath } from '@/src/lib/discoveryRoutes';

import {getRegionBySlug} from '@/src/lib/regions';

const EXCLUDED_PREFIXES = ["/api", "/private", "/admin", "/admin-dashboard", "/dashboard", "/blog"];
const EXCLUDED_EXACT = new Set([
  "/",
  "/bd",
  "/in",
  "/sg",
  "/ph",
  "/us",
  "/uk",
  "/ca",
  "/au",
  "/usa",
  "/united-states",
  "/america",
  "/australia",
  "/spain",
  "/netherlands",
  "/italy",
  "/poland",
  "/paris",
]);

export default function GlobalHomepageContinuation() {
  const pathname = usePathname();
  const [embedded,setEmbedded]=useState(true);
  useEffect(()=>{setEmbedded(window.self!==window.top);},[]);

  const shouldRender = useMemo(() => {
    if (isDiscoveryPath(pathname)||getRegionBySlug(pathname.slice(1))) return false;
    if (EXCLUDED_EXACT.has(pathname)) return false;
    if (EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
    return true;
  }, [pathname]);

  if (!shouldRender || embedded) return null;

  return (
    <section aria-label="Full BloodNet homepage experience" className="mt-10 border-t border-white/20 pt-8">
      <HomeExperience />
    </section>
  );
}

