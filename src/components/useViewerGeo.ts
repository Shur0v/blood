import { useEffect, useState } from "react";

interface ViewerGeo {
  city?: string;
  country?: string;
  source?: "geo" | "locale";
}

const CACHE_KEY = "bloodnet_viewer_geo_v1";

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

    const setIfActive = (next: ViewerGeo) => {
      if (!cancelled) setGeo((prev) => ({ ...prev, ...next }));
    };

    const cachedRaw = sessionStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as ViewerGeo;
        const normalizedCached: ViewerGeo = {
          ...cached,
          source: cached.source || (cached.city ? "geo" : "locale"),
        };
        setIfActive(normalizedCached);
        return () => {
          cancelled = true;
        };
      } catch {
        // ignore invalid cache
      }
    }

    const localeCountry = deriveCountryFromLocale();
    if (localeCountry) {
      setIfActive({ country: localeCountry, source: "locale" });
    }

    if (!navigator.geolocation) {
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`, { method: "GET", cache: "no-store" });
          const payload = await res.json();
          if (!res.ok || !payload.success) return;

          const detected: ViewerGeo = {
            city: payload.data?.city || undefined,
            country: payload.data?.country || localeCountry,
            source: "geo",
          };
          setIfActive(detected);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(detected));
          } catch {
            // ignore storage issues
          }
        } catch {
          // ignore geo errors
        }
      },
      () => {
        if (localeCountry) {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ country: localeCountry, source: "locale" }));
          } catch {
            // ignore storage issues
          }
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 300000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return geo;
}
