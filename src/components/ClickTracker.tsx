"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type DeviceType = "mobile" | "tablet" | "desktop";

interface ClickEventPayload {
  page: string;
  component: string;
  deviceType: DeviceType;
  timestamp: string;
}

interface HeatmapEventPayload {
  page: string;
  deviceType: DeviceType;
  eventType: "click" | "scroll";
  sessionId: string;
  clickX?: number;
  clickY?: number;
  viewportW: number;
  viewportH: number;
  scrollDepth?: number;
  timestamp: string;
}

const MAX_COMPONENT_LENGTH = 120;
const FLUSH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 100;
const HEATMAP_SESSION_STORAGE_KEY = "bn_heatmap_session_id";
const SCROLL_EVENT_STEP_PERCENT = 5;
const SCROLL_THROTTLE_MS = 1200;

const sanitizeLabel = (value: string): string => value.replace(/\s+/g, " ").trim().slice(0, MAX_COMPONENT_LENGTH);
const isLikelyUtilityClassText = (value: string): boolean => {
  const lower = value.toLowerCase();
  if (!lower.includes(" ")) return false;
  const utilityHints = ["flex", "items-", "justify-", "rounded-", "text-", "bg-", "hover:", "w-", "h-", "px-", "py-", "md:", "lg:", "xl:"];
  const matched = utilityHints.filter((hint) => lower.includes(hint)).length;
  return matched >= 2;
};

const compactHumanLabel = (value: string): string => {
  const cleaned = sanitizeLabel(value.replace(/[|,]+/g, " "));
  if (!cleaned) return "";
  if (isLikelyUtilityClassText(cleaned)) return "";

  const words = cleaned
    .split(" ")
    .filter((word) => !/^\+?\d{5,}$/.test(word))
    .slice(0, 4);
  return sanitizeLabel(words.join(" "));
};

const detectDeviceType = (): DeviceType => {
  const width = window.innerWidth;
  if (width <= 767) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
};

const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getHeatmapSessionId = (): string => {
  try {
    const existing = window.sessionStorage.getItem(HEATMAP_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const next = createSessionId();
    window.sessionStorage.setItem(HEATMAP_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
};

const extractComponentName = (target: HTMLElement | null): string | null => {
  if (!target) return null;

  const tagged = target.closest("[data-analytics-component]") as HTMLElement | null;
  if (tagged?.dataset.analyticsComponent) {
    return sanitizeLabel(tagged.dataset.analyticsComponent);
  }

  const clickable = target.closest("button, a, input, select, textarea, [role='button']") as HTMLElement | null;
  if (!clickable) {
    return null;
  }

  const source = clickable;
  const nearMenu = Boolean(source.closest("aside, nav, [data-analytics-menu='true']"));

  if (source.tagName === "A") {
    const linkLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("title") ||
      source.textContent ||
      ""
    );
    if (linkLabel) {
      return nearMenu ? `Menu: ${linkLabel}` : linkLabel;
    }
  }

  if (source.tagName === "BUTTON") {
    const buttonLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("title") ||
      source.textContent ||
      ""
    );
    if (buttonLabel) {
      return nearMenu ? `Menu: ${buttonLabel}` : buttonLabel;
    }
    return nearMenu ? "Menu: Icon Button" : "Icon Button";
  }

  if (source.tagName === "SELECT") {
    const selectLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("name") ||
      source.getAttribute("id") ||
      "Select Field"
    );
    return nearMenu ? `Menu: ${selectLabel}` : selectLabel;
  }

  if (source.tagName === "INPUT" || source.tagName === "TEXTAREA") {
    const inputLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("name") ||
      source.getAttribute("id") ||
      (source as HTMLInputElement).placeholder ||
      "Input Field"
    );
    return nearMenu ? `Menu: ${inputLabel}` : inputLabel;
  }

  const rawLabel =
    source.getAttribute("aria-label") ||
    source.getAttribute("title") ||
    source.textContent ||
    "";

  const label = compactHumanLabel(rawLabel);
  if (!label) return null;
  return nearMenu ? `Menu: ${label}` : label;
};

const normalizePage = (pathname: string): string => {
  if (pathname === "/") return "home";
  return pathname.replace(/^\//, "").replace(/\//g, " > ") || "unknown";
};

export default function ClickTracker() {
  const pathname = usePathname();
  const queueRef = useRef<ClickEventPayload[]>([]);
  const heatmapQueueRef = useRef<HeatmapEventPayload[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const heatmapFlushTimerRef = useRef<number | null>(null);
  const lastScrollEmitRef = useRef<number>(0);
  const maxScrollDepthSentRef = useRef<number>(0);
  const isFlushingRef = useRef(false);
  const isHeatmapFlushingRef = useRef(false);
  const hasBeaconFlushedRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin-dashboard")) return;
    if (pathname.startsWith("/api")) return;
    const heatmapSessionId = getHeatmapSessionId();

    const flush = async () => {
      if (isFlushingRef.current) return;
      if (queueRef.current.length === 0) return;

      isFlushingRef.current = true;
      const batch = queueRef.current.splice(0, FLUSH_SIZE);
      try {
        await fetch("/api/analytics/clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: batch }),
          keepalive: true,
        });
      } catch (error) {
        queueRef.current = [...batch, ...queueRef.current];
      } finally {
        isFlushingRef.current = false;
      }
    };

    const flushHeatmap = async () => {
      if (isHeatmapFlushingRef.current) return;
      if (heatmapQueueRef.current.length === 0) return;

      isHeatmapFlushingRef.current = true;
      const batch = heatmapQueueRef.current.splice(0, FLUSH_SIZE);
      try {
        await fetch("/api/analytics/heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: batch }),
          keepalive: true,
        });
      } catch (error) {
        heatmapQueueRef.current = [...batch, ...heatmapQueueRef.current];
      } finally {
        isHeatmapFlushingRef.current = false;
      }
    };

    const enqueue = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const component = extractComponentName(target);
      if (!component) return;

      const bodyPage = document.body.dataset.analyticsPage;
      const page = bodyPage ? sanitizeLabel(bodyPage) : normalizePage(pathname);
      queueRef.current.push({
        page,
        component,
        deviceType: detectDeviceType(),
        timestamp: new Date().toISOString(),
      });

      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const x = Math.max(0, Math.min(1, event.clientX / width));
      const y = Math.max(0, Math.min(1, event.clientY / height));
      heatmapQueueRef.current.push({
        page,
        eventType: "click",
        sessionId: heatmapSessionId,
        deviceType: detectDeviceType(),
        clickX: Number(x.toFixed(4)),
        clickY: Number(y.toFixed(4)),
        viewportW: width,
        viewportH: height,
        timestamp: new Date().toISOString(),
      });
      if (queueRef.current.length > MAX_QUEUE_SIZE) {
        queueRef.current = queueRef.current.slice(queueRef.current.length - MAX_QUEUE_SIZE);
      }
      if (heatmapQueueRef.current.length > MAX_QUEUE_SIZE) {
        heatmapQueueRef.current = heatmapQueueRef.current.slice(heatmapQueueRef.current.length - MAX_QUEUE_SIZE);
      }

      if (queueRef.current.length >= FLUSH_SIZE) {
        void flush();
      }
      if (heatmapQueueRef.current.length >= FLUSH_SIZE) {
        void flushHeatmap();
      }
    };

    const enqueueScrollDepth = () => {
      const now = Date.now();
      if (now - lastScrollEmitRef.current < SCROLL_THROTTLE_MS) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportHeight = window.innerHeight || 1;
      const docHeight = Math.max(
        document.documentElement.scrollHeight || 0,
        document.body.scrollHeight || 0
      );
      const scrollable = Math.max(1, docHeight - viewportHeight);
      const rawDepth = Math.round((scrollTop / scrollable) * 100);
      const depth = Math.max(0, Math.min(100, rawDepth));
      const shouldEmit =
        depth >= maxScrollDepthSentRef.current + SCROLL_EVENT_STEP_PERCENT ||
        (depth === 100 && depth !== maxScrollDepthSentRef.current);

      if (!shouldEmit) return;

      const bodyPage = document.body.dataset.analyticsPage;
      const page = bodyPage ? sanitizeLabel(bodyPage) : normalizePage(pathname);
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      maxScrollDepthSentRef.current = depth;
      lastScrollEmitRef.current = now;

      heatmapQueueRef.current.push({
        page,
        eventType: "scroll",
        sessionId: heatmapSessionId,
        deviceType: detectDeviceType(),
        viewportW: width,
        viewportH: height,
        scrollDepth: depth,
        timestamp: new Date().toISOString(),
      });

      if (heatmapQueueRef.current.length > MAX_QUEUE_SIZE) {
        heatmapQueueRef.current = heatmapQueueRef.current.slice(heatmapQueueRef.current.length - MAX_QUEUE_SIZE);
      }
      if (heatmapQueueRef.current.length >= FLUSH_SIZE) {
        void flushHeatmap();
      }
    };

    const flushWithBeacon = () => {
      if (hasBeaconFlushedRef.current) return;
      if (queueRef.current.length === 0 && heatmapQueueRef.current.length === 0) return;
      hasBeaconFlushedRef.current = true;
      const clickPayload = JSON.stringify({ events: queueRef.current.splice(0, MAX_QUEUE_SIZE) });
      const heatPayload = JSON.stringify({ events: heatmapQueueRef.current.splice(0, MAX_QUEUE_SIZE) });
      navigator.sendBeacon?.("/api/analytics/clicks", new Blob([clickPayload], { type: "application/json" }));
      navigator.sendBeacon?.("/api/analytics/heatmap", new Blob([heatPayload], { type: "application/json" }));
    };

    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        flushWithBeacon();
      }
    };

    document.addEventListener("click", enqueue, true);
    window.addEventListener("scroll", enqueueScrollDepth, { passive: true });
    window.addEventListener("beforeunload", flushWithBeacon);
    document.addEventListener("visibilitychange", visibilityHandler);
    flushTimerRef.current = window.setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);
    heatmapFlushTimerRef.current = window.setInterval(() => {
      void flushHeatmap();
    }, FLUSH_INTERVAL_MS);

    return () => {
      document.removeEventListener("click", enqueue, true);
      window.removeEventListener("scroll", enqueueScrollDepth);
      window.removeEventListener("beforeunload", flushWithBeacon);
      document.removeEventListener("visibilitychange", visibilityHandler);
      if (flushTimerRef.current) {
        window.clearInterval(flushTimerRef.current);
      }
      if (heatmapFlushTimerRef.current) {
        window.clearInterval(heatmapFlushTimerRef.current);
      }
      void flush();
      void flushHeatmap();
    };
  }, [pathname]);

  return null;
}
