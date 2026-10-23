"use client";
import { discoverDonors } from '../lib/donorDiscovery';

import usePublicAds from "./usePublicAds";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";
import DonorModal from "./DonorModal";
import useDonorRegion from "./useDonorRegion";
import { maskPhoneTail } from "../lib/phoneMask";
import FooterBottomBannerAd from "./FooterBottomBannerAd";
import DonorBloodFilters from "./DonorBloodFilters";


interface Donor {
  id: string;
  name: string;
  phone: string;
  maskedPhone: string;
  group: string;
  location: string;
  verificationStatus?: string | null;
  hemoglobin?: string | null;
  lastDonationDate?: string | null;
  sourceType?: "REGISTERED" | "MANUAL" | "COMMUNITY";
}

interface DonorApiResponse {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    mobile: string;
    blood_group: string | null;
    location_city: string;
    location_country: string;
    verification_status?: string | null;
    hemoglobin?: string | null;
    last_donation_date?: string | null;
    source_type?: "REGISTERED" | "MANUAL" | "COMMUNITY";
  }>;
  pagination?: {
    nextCursor: string | null;
    total: number;
  };
  meta?: {
    globalTotal?: number;
  };
}

type InlineBannerAdUnit = {
  id: string;
  adType: "iframe_banner";
  scriptSrc: string;
  bannerKey: string;
  bannerWidth: number;
  bannerHeight: number;
  placement: "donor_cards_mix";
};

function MixedDonorBannerCard({ ad, onFail }: { ad: InlineBannerAdUnit; onFail: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.innerHTML = "";

    (window as Window & { atOptions?: unknown }).atOptions = {
      key: ad.bannerKey,
      format: "iframe",
      height: ad.bannerHeight,
      width: ad.bannerWidth,
      params: {},
    };

    const script = document.createElement("script");
    script.src = ad.scriptSrc;
    script.async = false;
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-bloodnet-inline-banner", ad.id);
    mount.appendChild(script);

    const checkTimer = window.setTimeout(() => {
      const hasFrame = Boolean(mount.querySelector("iframe"));
      if (!hasFrame) onFail();
    }, 2000);

    return () => {
      window.clearTimeout(checkTimer);
      mount.innerHTML = "";
    };
  }, [ad.bannerHeight, ad.bannerKey, ad.bannerWidth, ad.id, ad.scriptSrc, onFail]);

  return (
    <div className="group relative flex items-center gap-3 overflow-hidden rounded-[8px] border border-white/40 bg-white/20 p-2 pr-4 shadow-card backdrop-blur-2xl transition-all duration-300">
      <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/50" />
      <div className="relative z-10 flex w-full items-center justify-center py-1">
        <div
          ref={mountRef}
          style={{ width: `${ad.bannerWidth}px`, minHeight: `${ad.bannerHeight}px` }}
          className="mx-auto max-w-full overflow-hidden"
        />
      </div>
    </div>
  );
}

const DONOR_GRID_AD_SLOTS = 4;

export default function Hero({ forcedCountry, initialCity = '', initialGroup = null, headingLevel = 1 }: { forcedCountry?: string; initialCity?: string; initialGroup?: string | null; headingLevel?: 1 | 2 }) {
  const adsConfig = usePublicAds();
  const readServerRenderedDonorTotal = () => {
    if (forcedCountry) return 0;
    if (typeof window !== "undefined") {
      const value = Number((window as any).__BLOODNET_PUBLIC_STATS__?.activeBloodDonors ?? 0);
      if (Number.isFinite(value) && value > 0) return value;
    }
    if (typeof document === "undefined") return 0;
    const raw = document
      .getElementById("bloodnet-public-stats")
      ?.getAttribute("data-active-blood-donors");
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  const [activeGroup, setActiveGroup] = useState<string | null>(initialGroup);
  const [searchQuery, setSearchQuery] = useState(initialCity);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [totalActiveDonors, setTotalActiveDonors] = useState(readServerRenderedDonorTotal);
  const [isDonorApiDown, setIsDonorApiDown] = useState(false);
  const [isInitialDonorLoad, setIsInitialDonorLoad] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [inlineBannerAd, setInlineBannerAd] = useState<InlineBannerAdUnit | null>(null);
  const [hideInlineBanner, setHideInlineBanner] = useState(false);
  const [failedAdSlots, setFailedAdSlots] = useState<Record<number, boolean>>({});
  const [hasLoadedMoreOnce, setHasLoadedMoreOnce] = useState(false);


  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  const normalizedSearch = searchQuery.trim();
  const viewerGeo = useDonorRegion(forcedCountry);
  const [loadedCountry, setLoadedCountry] = useState('');
  const [discoveryNotice,setDiscoveryNotice]=useState('');
  const effectiveQuery=useRef<URLSearchParams|null>(null);
  const regionKey=viewerGeo.country||'global';
  const localReady = Boolean(viewerGeo.resolved) && loadedCountry === regionKey;
  const donorCacheKey = `bloodnet_public_donors_cache:v8:${viewerGeo.country}:${initialCity || viewerGeo.city || ''}:${activeGroup || 'all'}:${normalizedSearch}`;
  const donorRequests = useRef<AbortController | null>(null);
  const buildBaseParams = () => {
    const params = new URLSearchParams({ limit: "16", sort: 'NEARBY',expand:'nearby' });
    if (viewerGeo.country) {
      params.set("country", viewerGeo.country);
    }
    if (activeGroup) {
      params.set("bloodGroup", activeGroup);
    }
    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }
    if (normalizedSearch || initialCity || viewerGeo.city) {
      params.set("viewerCity", normalizedSearch || initialCity || viewerGeo.city);
    }
    if (viewerGeo.country) {
      params.set("viewerCountry", viewerGeo.country);
    }
    // A location page belongs to its named area, not the visiting device's
    // different city. Do not let remote visitor coordinates outrank that area.
    if((!initialCity || viewerGeo.city?.toLowerCase() === initialCity.toLowerCase()) && (!normalizedSearch || normalizedSearch.toLowerCase()===viewerGeo.city?.toLowerCase()) && viewerGeo.lat!==undefined&&viewerGeo.lng!==undefined){params.set("viewerLat",String(viewerGeo.lat));params.set("viewerLng",String(viewerGeo.lng));}
    return params;
  };

  const mapRows = (
    rows: NonNullable<DonorApiResponse["data"]>,
  ): Donor[] =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.mobile,
      maskedPhone: maskPhoneTail(row.mobile),
      group: row.blood_group || "★",
      location: `${row.location_city}, ${row.location_country}`,
      verificationStatus: row.verification_status ?? null,
      hemoglobin: row.hemoglobin ?? null,
      lastDonationDate: row.last_donation_date ?? null,
      sourceType: row.source_type ?? "REGISTERED",
    }));

  const hydrateFromCache = () => {
    try {
      const raw = localStorage.getItem(donorCacheKey);
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw) as { donors: Donor[]; totalActiveDonors: number };
      if (Array.isArray(parsed.donors) && typeof parsed.totalActiveDonors === "number") {
        setDonors(parsed.donors);
        setLoadedCountry(regionKey);
        setTotalActiveDonors(parsed.totalActiveDonors);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const hydrateFromSiteState = async (signal?: AbortSignal) => {
    if (forcedCountry) return false;
    try {
      const res = await fetch("/site-state.json", {
        method: "GET",
        cache: "no-store",
        signal,
      });
      const payload = await res.json();
      const nextTotal = Number(
        payload?.publicNetwork?.activeBloodDonors ??
          payload?.data?.publicNetwork?.activeBloodDonors ??
          payload?.activeBloodDonors ??
          0,
      );
      if (!res.ok || !Number.isFinite(nextTotal) || nextTotal <= 0) return false;
      setTotalActiveDonors(nextTotal);
      return true;
    } catch {
      return false;
    }
  };

  const persistCache = (nextDonors: Donor[], nextTotal: number) => {
    try {
      localStorage.setItem(
        donorCacheKey,
        JSON.stringify({ donors: nextDonors, totalActiveDonors: nextTotal })
      );
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    const controls = animate(count, totalActiveDonors, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [count, totalActiveDonors]);


  useEffect(() => {
    const controller = new AbortController();
    donorRequests.current = controller;
    setSelectedDonor(null);
    setNextCursor(null);
    setDonors([]);
    setIsDonorApiDown(false);
    setDiscoveryNotice('');
    setLoadedCountry(regionKey);
    setIsInitialDonorLoad(Boolean(viewerGeo.resolved));
    if (!viewerGeo.resolved) return () => controller.abort();
    const loadDonors = async () => {
      try {
        const params = buildBaseParams();

        const discovery=await discoverDonors('/api/public/donors',params,controller.signal);
        const payload=discovery.payload;
        if(controller.signal.aborted)return;
        effectiveQuery.current=discovery.params;setDiscoveryNotice(discovery.notice);
        const mapped = mapRows(payload.data || []);

        setDonors(mapped);
        setLoadedCountry(regionKey);
        setNextCursor(payload.pagination?.nextCursor ?? null);
        const nextTotal = Number(payload.meta?.globalTotal ?? payload.pagination?.total ?? 0);
        setTotalActiveDonors(nextTotal);
        persistCache(mapped, nextTotal);
        setIsDonorApiDown(false);
        setIsInitialDonorLoad(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setIsDonorApiDown(true);
        // Statistics contain counts, not cards. Restore the scoped card cache
        // independently rather than letting a successful count hide it.
        hydrateFromCache();
        await hydrateFromSiteState(controller.signal);
        if (controller.signal.aborted) return;
        setIsInitialDonorLoad(false);
      }
    };

    void loadDonors();
    return () => controller.abort();
  }, [activeGroup, normalizedSearch, viewerGeo.city, viewerGeo.country, viewerGeo.resolved, viewerGeo.lat, viewerGeo.lng, forcedCountry, initialCity, retryAttempt]);

  useEffect(() => {
    const reconnect = () => setRetryAttempt(value => value + 1);
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, []);

  useEffect(() => {
    setHasLoadedMoreOnce(false);
    setHideInlineBanner(false);
    setFailedAdSlots({});
  }, [activeGroup, normalizedSearch, viewerGeo.city, viewerGeo.country]);

  useEffect(() => {
    const data = adsConfig;
    if (!data?.adsRuntimeEnabled) { setInlineBannerAd(null); return; }
    (() => {
        const found = (data.adUnits || []).find((item: any) =>
          item?.adType === "iframe_banner" &&
          item?.placement === "donor_cards_mix" &&
          item?.scriptSrc &&
          item?.bannerKey &&
          Number(item?.bannerWidth) > 0 &&
          Number(item?.bannerHeight) > 0
        );
        if (!found) {
          setInlineBannerAd(null);
          return;
        }
        setInlineBannerAd({
          id: String(found.id),
          adType: "iframe_banner",
          scriptSrc: String(found.scriptSrc),
          bannerKey: String(found.bannerKey),
          bannerWidth: Number(found.bannerWidth),
          bannerHeight: Number(found.bannerHeight),
          placement: "donor_cards_mix",
        });
        setHideInlineBanner(false);
    })();
  }, [adsConfig]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore || !localReady) return;
    const signal = donorRequests.current?.signal;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(effectiveQuery.current || buildBaseParams());
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/public/donors?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });
      const payload = (await res.json()) as DonorApiResponse;
      if (signal?.aborted || !res.ok || !payload.success) {
        return;
      }
      const mapped = mapRows(payload.data || []);
      setDonors(prev=>[...new Map([...prev,...mapped].map(row=>[`${row.sourceType}:${row.id}`,row])).values()]);
      setNextCursor(payload.pagination?.nextCursor ?? null);
      setHasLoadedMoreOnce(true);
    } catch { /* Preserve local cards if pagination fails or is cancelled. */ } finally {
      setIsLoadingMore(false);
    }
  };

  const hasNoResults = useMemo(() => donors.length === 0, [donors]);
  const adInsertIndexes = useMemo(() => {
    if (!hasLoadedMoreOnce || !inlineBannerAd || hideInlineBanner || donors.length === 0) return [] as number[];
    const seed = `${donors[0]?.id || "seed"}-${donors.length}-${activeGroup || "all"}-${normalizedSearch || "none"}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    const out: number[] = [];
    const max = donors.length + 1;
    for (let i = 0; i < Math.min(DONOR_GRID_AD_SLOTS, max); i += 1) {
      const idx = Math.abs(hash + i * 17) % max;
      if (!out.includes(idx)) out.push(idx);
    }
    return out;
  }, [hasLoadedMoreOnce, inlineBannerAd, hideInlineBanner, donors, activeGroup, normalizedSearch]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-32">
      <div className="absolute top-1/4 left-1/4 hidden h-64 w-64 rounded-full bg-primary-dark/10 blur-[100px] md:block" />
      <div className="absolute bottom-1/4 right-1/4 hidden h-96 w-96 rounded-full bg-primary/5 blur-[120px] md:block" />

      <div className="relative z-10 w-full max-w-7xl">
        <motion.div
          className="glass relative mx-auto mb-12 w-full max-w-4xl overflow-hidden rounded-[8px] p-10 text-center shadow-2xl"
        >
          <div className="relative z-10">
            <motion.div
              className="mb-10 inline-flex flex-col items-center rounded-[8px] bg-gray-900 p-1.5 shadow-2xl"
            >
              <div className="flex min-w-[160px] items-center justify-center rounded-[6px] bg-white py-4">
                <motion.span className="text-5xl font-semibold tabular-nums tracking-tighter text-gray-900">
                  {rounded}
                </motion.span>
              </div>
              <div className="px-4 py-2">
                <span className="text-base font-bold lowercase tracking-[2px] text-white">
                  active donor
                </span>
              </div>
            </motion.div>

            {headingLevel === 1 ? <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Every Drop <span className="text-primary-dark">Counts</span>.
            </h1> : <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">Every Drop <span className="text-primary-dark">Counts</span>.</h2>}

            <p className="mx-auto mb-8 max-w-2xl text-base text-gray-500">
              Join our premium community of life-savers. Connect with donors instantly and manage blood stocks with our futuristic medical dashboard.
            </p>

            <div className="mx-auto w-full max-w-5xl">{discoveryNotice&&<p role="status" className="sr-only">{discoveryNotice}</p>}<DonorBloodFilters activeGroup={activeGroup} onGroupChange={setActiveGroup} searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search city or donor name…" analyticsPrefix="Blood" /></div>
          </div>

          <div className="absolute inset-0 -z-10 opacity-[0.03]">
            <div className="liquid-bg absolute inset-0" />
          </div>
        </motion.div>

        {!viewerGeo.resolved || isInitialDonorLoad || !localReady ? (
          <div className="mx-auto min-h-[320px] max-w-4xl rounded-[8px] border border-white/40 bg-white/20 p-8 text-center text-sm font-semibold text-gray-700">
            Loading nearby active donors...
          </div>
        ) : hasNoResults ? (
          <div className="mx-auto min-h-[320px] max-w-4xl rounded-[8px] border border-white/40 bg-white/20 p-8 text-center text-sm font-semibold text-gray-700">
            <p>{isDonorApiDown ? 'Donor cards could not be loaded. Please retry.' : `No matching donor entries${viewerGeo.country ? ` in ${viewerGeo.country}` : ''}${normalizedSearch ? ` for “${normalizedSearch}”` : ''}${activeGroup ? ` (${activeGroup})` : ''}.`}</p>
            <button type="button" className="mt-4 rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700" onClick={() => isDonorApiDown ? setRetryAttempt(value => value + 1) : document.querySelector<HTMLButtonElement>('.donor-discovery-trigger')?.click()}>
              {isDonorApiDown ? 'Retry donor search' : 'Choose another location'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {donors.map((donor, index) => (
              <div key={`slot-${donor.id}`}>
                {inlineBannerAd && !hideInlineBanner && adInsertIndexes.includes(index) && !failedAdSlots[index] && (
                  <motion.div key={`ad-inline-${inlineBannerAd.id}-${index}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                    <MixedDonorBannerCard ad={inlineBannerAd} onFail={() => setFailedAdSlots((prev) => ({ ...prev, [index]: true }))} />
                  </motion.div>
                )}
                <motion.div
                  key={donor.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedDonor(donor)}
                  data-analytics-component="Blood Donor Card Open"
                  whileHover={{
                    y: -5,
                    transition: { type: "spring", stiffness: 400, damping: 15 }
                  }}
                  className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[8px] border border-white/40 bg-white/20 p-2 pr-4 shadow-card backdrop-blur-2xl transition-all duration-300 hover:border-primary-dark/40 hover:shadow-card"
                >
                  <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/50" />

                  <div className="relative z-10 flex w-full items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-primary-dark text-lg font-semibold text-white shadow-card">
                      {donor.sourceType === "COMMUNITY" ? (
                        <Star className="h-5 w-5 fill-white text-white" />
                      ) : (
                        donor.group
                      )}
                    </div>

                    <div className="ml-3 flex flex-1 flex-col overflow-hidden">
                      <h3 className="truncate text-sm font-bold tracking-tight text-gray-900">{donor.name}</h3>
                      <div className="mt-0.5 flex flex-col text-[10px] font-medium text-gray-600">
                        <span className="truncate">{donor.maskedPhone}</span>
                        <span className="truncate opacity-70">{donor.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-full -left-full h-[200%] w-[200%] rotate-45 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 transition-all duration-700 group-hover:top-[-50%] group-hover:left-[-50%] group-hover:opacity-100" />
                </motion.div>
              </div>
            ))}
            {inlineBannerAd && !hideInlineBanner && adInsertIndexes.includes(donors.length) && !failedAdSlots[donors.length] && (
              <motion.div key={`ad-inline-tail-${inlineBannerAd.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <MixedDonorBannerCard ad={inlineBannerAd} onFail={() => setFailedAdSlots((prev) => ({ ...prev, [donors.length]: true }))} />
              </motion.div>
            )}
          </div>
        )}
        {isDonorApiDown && (
          <p className="mx-auto mt-4 max-w-4xl text-center text-xs font-semibold text-amber-700">
            {donors.length ? 'Live donor feed is unavailable. Showing saved results for these filters.' : 'The donor feed is unavailable. This does not mean there are no donors.'}
          </p>
        )}
        {localReady && nextCursor && !hasNoResults && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
              data-analytics-component="Blood Donor Show More"
              className="rounded-[8px] bg-primary-dark px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Show More"}
            </button>
          </div>
        )}
        <div className="mt-10 space-y-6">
          <FooterBottomBannerAd />
        </div>
      </div>

      <DonorModal donor={localReady ? selectedDonor : null} onClose={() => setSelectedDonor(null)} />
    </section>
  );
}
