"use client";

import { useEffect, useState } from "react";
import ClickTracker from "@/src/components/ClickTracker";
import ThemeRuntimeSync from "@/src/components/ThemeRuntimeSync";

export default function DeferredClientEffects() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const schedule = (cb: () => void) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(() => cb());
      } else {
        globalThis.setTimeout(cb, 800);
      }
    };
    schedule(() => setReady(true));
  }, []);

  if (!ready) return null;
  return (
    <>
      <ThemeRuntimeSync />
      <ClickTracker />
    </>
  );
}
