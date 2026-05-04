"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/src/components/Navbar";

const getCurrentPage = (pathname: string) => {
  if (pathname.startsWith("/organ")) return "organ";
  if (pathname.startsWith("/blog")) return "blog";
  return "home";
};

export default function SiteNavShell() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPage = useMemo(() => getCurrentPage(pathname), [pathname]);

  return (
    <Navbar
      currentPage={currentPage}
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
      onHomeClick={() => router.push("/")}
      onAuthClick={() => router.push("/?profile=1")}
      isLoggedIn={false}
    />
  );
}
