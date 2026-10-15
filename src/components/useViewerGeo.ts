import { useEffect, useState } from "react";

interface ViewerGeo {
  city?: string;
  country?: string;
  source?: "gps" | "ip" | "timezone" | "locale";
  updatedAt?: number;
}

const CACHE_KEY = "bloodnet_viewer_geo_v1";

const TIMEZONE_COUNTRY_MAP: Array<{ zone: string; country: string }> = [
  { zone: "Asia/Dhaka", country: "Bangladesh" },
  { zone: "Asia/Dacca", country: "Bangladesh" },
  { zone: "Asia/Kolkata", country: "India" },
  { zone: "Asia/Calcutta", country: "India" },
  { zone: "Asia/Singapore", country: "Singapore" },
  { zone: "Asia/Manila", country: "Philippines" },
  { zone: "Europe/London", country: "United Kingdom" },
  { zone: "America/New_York", country: "United States" },
  { zone: "America/Chicago", country: "United States" },
  { zone: "America/Denver", country: "United States" },
  { zone: "America/Los_Angeles", country: "United States" },
  { zone: "America/Toronto", country: "Canada" },
  { zone: "Australia/Sydney", country: "Australia" },
  { zone: "Australia/Melbourne", country: "Australia" },
];

const deriveCountryFromTimezone = (): string | undefined => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return undefined;

    const exact = TIMEZONE_COUNTRY_MAP.find((item) => item.zone === zone);
    if (exact) return exact.country;

    if (zone.startsWith("Asia/")) {
      if (zone.includes("Karachi")) return "Pakistan";
      if (zone.includes("Kathmandu")) return "Nepal";
    }
    if (zone.startsWith("Europe/")) {
      if (zone.includes("Berlin")) return "Germany";
      if (zone.includes("Paris")) return "France";
      if (zone.includes("Madrid")) return "Spain";
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const deriveCountryFromLocale = (): string | undefined => {
  try {
    const locale = navigator.language || "";
    const parts = locale.split("-");
    const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
    if (!region || region.length !== 2) return undefined;
    return new Intl.DisplayNames(["en"], { type: "region" }).of(region) || undefined;
  } catch {
    return undefined;
  }
};

export default function useViewerGeo() {
  const [geo, setGeo] = useState<ViewerGeo>({});

  useEffect(() => {
    let cancelled = false;

    const sourceRank: Record<NonNullable<ViewerGeo["source"]>, number> = {
      locale: 1,
      timezone: 2,
      ip: 3,
      gps: 4,
    };

    const setIfActive = (next: ViewerGeo) => {
      if (cancelled) return;
      setGeo((prev) => {
        const prevRank = prev.source ? sourceRank[prev.source] : 0;
        const nextRank = next.source ? sourceRank[next.source] : 0;
        const shouldReplace =
          !prev.country ||
          nextRank >= prevRank;
        if (!shouldReplace) return prev;
        return { ...next };
      });
    };

    let cachedRaw: string | null = null;
    try { cachedRaw = sessionStorage.getItem(CACHE_KEY); } catch { /* Storage can be disabled. */ }
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as ViewerGeo;
        const normalizedCached: ViewerGeo = {
          ...cached,
          source: cached.source || "locale",
        };
        if (cached.updatedAt && Date.now() - cached.updatedAt < 10 * 60 * 1000) setIfActive(normalizedCached);
      } catch {
        // ignore invalid cache
      }
    }

    const persist = (next: ViewerGeo) => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage issues
      }
    };

    let fallbackStarted = false;
    const applyGeoFallback = async () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      try {
        const res = await fetch("/api/location/ip", {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        const payload = (await res.json()) as {
          success?: boolean;
          data?: { country?: string };
        };
        const ipCountry = payload?.data?.country?.trim();
        if (res.ok && payload?.success && ipCountry) {
          const next = { country: ipCountry, source: "ip" as const, updatedAt: Date.now() };
          setIfActive(next);
          persist(next);
          return;
        }
      } catch {
        // continue to timezone/locale fallback
      }

      const timezoneCountry = deriveCountryFromTimezone();
      if (timezoneCountry) {
        const next = { country: timezoneCountry, source: "timezone" as const, updatedAt: Date.now() };
        setIfActive(next);
        persist(next);
        return;
      }

      const localeCountry = deriveCountryFromLocale();
      if (localeCountry) {
        const next = { country: localeCountry, source: "locale" as const, updatedAt: Date.now() };
        setIfActive(next);
        persist(next);
      }
    };

    // Resolve a country promptly even while a GPS permission prompt is pending.
    void applyGeoFallback();
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return () => {
        cancelled = true;
      };
    }

    const askGeolocation = () =>
      navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
          });
          const res = await fetch(`/api/location/reverse?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });
          const payload = (await res.json()) as {
            success?: boolean;
            data?: { city?: string; country?: string };
          };
          const next: ViewerGeo = {
            city: payload?.data?.city?.trim() || undefined,
            country: payload?.data?.country?.trim() || undefined,
            source: "gps",
            updatedAt: Date.now(),
          };
          if (!res.ok || !payload?.success || !next.country) {
            void applyGeoFallback();
            return;
          }
          setIfActive(next);
          persist(next);
        } catch {
          void applyGeoFallback();
        }
      },
      () => {
        void applyGeoFallback();
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000,
      }
    );

    const permissionsApi = (navigator as Navigator & {
      permissions?: { query: (descriptor: { name: "geolocation" }) => Promise<{ state: PermissionState }> };
    }).permissions;

    if (permissionsApi?.query) {
      void permissionsApi
        .query({ name: "geolocation" })
        .then((status) => {
          if (status.state === "denied") {
            void applyGeoFallback();
            return;
          }
          askGeolocation();
        })
        .catch(() => {
          askGeolocation();
        });
    } else {
      askGeolocation();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return geo;
}
