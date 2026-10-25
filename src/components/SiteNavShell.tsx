"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/src/components/Navbar";
import { useSiteNavigation } from './SiteNavigationProvider';
import {openFreshHome} from '../lib/homeNavigation';

const getCurrentPage = (pathname: string) => {
  if (pathname.startsWith("/organ")) return "organ";
  if (pathname.startsWith("/blog")) return "blog";
  return pathname === '/' ? 'home' : '';
};

export default function SiteNavShell() {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useSiteNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (navigation) return;
    const controller = new AbortController();
    const refresh=()=>{void fetch('/api/auth/session', { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) return false; return Boolean((await response.json()).user); })
      .then(value => { if (!controller.signal.aborted) setIsLoggedIn(value); })
      .catch(() => { /* Navigation stays usable when the session service is unavailable. */ });};
    refresh();window.addEventListener('bloodnet:session-changed',refresh);
    return () => {controller.abort();window.removeEventListener('bloodnet:session-changed',refresh);};
  }, [pathname, Boolean(navigation)]);

  if (navigation) return <Navbar {...navigation} />;

  return (
    <Navbar
      currentPage={getCurrentPage(pathname)}
      onPageChange={(page) => {
        if (page === "organ") {
          router.push("/organ");
          return;
        }
        if (page === "blog") {
          router.push("/blog");
          return;
        }
        router.push("/");
      }}
      onHomeClick={() => openFreshHome()}
      onAuthClick={() => router.push("/?profile=1")}
      isLoggedIn={isLoggedIn}
    />
  );
}
