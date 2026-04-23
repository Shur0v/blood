import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { gsap } from "gsap";
import DonorModal from "./DonorModal";
import useViewerGeo from "./useViewerGeo";
import { maskPhoneTail } from "../lib/phoneMask";

const bloodGroups = ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"];

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
}

interface DonorApiResponse {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    mobile: string;
    blood_group: string;
    location_city: string;
    location_country: string;
    verification_status?: string | null;
    hemoglobin?: string | null;
    last_donation_date?: string | null;
  }>;
  pagination?: {
    nextCursor: string | null;
    total: number;
  };
  meta?: {
    globalTotal?: number;
  };
}

export default function Hero() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [totalActiveDonors, setTotalActiveDonors] = useState(0);
  const [isDonorApiDown, setIsDonorApiDown] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const controlsWrapperRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  const normalizedSearch = searchQuery.trim();
  const donorCacheKey = "bloodnet_public_donors_cache";
  const viewerGeo = useViewerGeo();
  const buildBaseParams = () => {
    const params = new URLSearchParams({ limit: "16" });
    if (activeGroup) {
      params.set("bloodGroup", activeGroup);
    }
    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }
    if (viewerGeo.city) {
      params.set("viewerCity", viewerGeo.city);
    }
    if (viewerGeo.country && (viewerGeo.city || viewerGeo.source === "geo")) {
      params.set("viewerCountry", viewerGeo.country);
    }
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
      group: row.blood_group,
      location: `${row.location_city}, ${row.location_country}`,
      verificationStatus: row.verification_status ?? null,
      hemoglobin: row.hemoglobin ?? null,
      lastDonationDate: row.last_donation_date ?? null,
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
        setTotalActiveDonors(parsed.totalActiveDonors);
        return true;
      }
      return false;
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
    if (isSearchOpen) {
      gsap.to(controlsWrapperRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        display: "none",
        ease: "power2.inOut"
      });

      gsap.fromTo(
        searchContainerRef.current,
        { opacity: 0, scaleX: 0.8, display: "none" },
        {
          opacity: 1,
          scaleX: 1,
          display: "flex",
          duration: 0.5,
          ease: "expo.out",
          onComplete: () => searchInputRef.current?.focus()
        }
      );
    } else {
      gsap.to(searchContainerRef.current, {
        opacity: 0,
        scaleX: 0.8,
        duration: 0.3,
        display: "none",
        ease: "power2.inOut"
      });

      gsap.fromTo(
        controlsWrapperRef.current,
        { opacity: 0, y: 10, display: "none" },
        {
          opacity: 1,
          y: 0,
          display: "flex",
          duration: 0.5,
          ease: "expo.out"
        }
      );
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const loadDonors = async () => {
      try {
        const params = buildBaseParams();

        const res = await fetch(`/api/public/donors?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await res.json()) as DonorApiResponse;

        if (!res.ok || !payload.success) {
          setIsDonorApiDown(true);
          if (donors.length === 0) {
            hydrateFromCache();
          }
          return;
        }

        const mapped = mapRows(payload.data || []);

        setDonors(mapped);
        setNextCursor(payload.pagination?.nextCursor ?? null);
        const nextTotal = Number(payload.meta?.globalTotal ?? payload.pagination?.total ?? 0);
        setTotalActiveDonors(nextTotal);
        persistCache(mapped, nextTotal);
        setIsDonorApiDown(false);
      } catch (error) {
        setIsDonorApiDown(true);
        if (donors.length === 0) {
          hydrateFromCache();
        }
      }
    };

    void loadDonors();
  }, [activeGroup, normalizedSearch, viewerGeo.city, viewerGeo.country]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = buildBaseParams();
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/public/donors?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await res.json()) as DonorApiResponse;
      if (!res.ok || !payload.success) {
        return;
      }
      const mapped = mapRows(payload.data || []);
      setDonors((prev) => [...prev, ...mapped]);
      setNextCursor(payload.pagination?.nextCursor ?? null);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (nextCursor) {
          return;
        }
        const params = buildBaseParams();

        const res = await fetch(`/api/public/donors?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await res.json()) as DonorApiResponse;
        if (!res.ok || !payload.success) {
          setIsDonorApiDown(true);
          return;
        }

        const mapped = mapRows(payload.data || []);

        setDonors(mapped);
        setNextCursor(payload.pagination?.nextCursor ?? null);
        const nextTotal = Number(payload.meta?.globalTotal ?? payload.pagination?.total ?? 0);
        setTotalActiveDonors(nextTotal);
        persistCache(mapped, nextTotal);
        setIsDonorApiDown(false);
      } catch (error) {
        setIsDonorApiDown(true);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [activeGroup, normalizedSearch, viewerGeo.city, viewerGeo.country, nextCursor]);

  const hasNoResults = useMemo(() => donors.length === 0, [donors]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-32">
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary-dark/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-7xl">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass relative mx-auto mb-12 w-full max-w-4xl overflow-hidden rounded-[8px] p-10 text-center shadow-2xl"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-10 inline-flex flex-col items-center rounded-[8px] bg-gray-900 p-1.5 shadow-2xl"
            >
              <div className="flex min-w-[160px] items-center justify-center rounded-[6px] bg-white py-4">
                <motion.span className="text-5xl font-black tabular-nums tracking-tighter text-gray-900">
                  {rounded}
                </motion.span>
              </div>
              <div className="px-4 py-2">
                <span className="text-base font-bold lowercase tracking-[2px] text-white">
                  active donor
                </span>
              </div>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Every Drop <span className="text-primary-dark">Counts</span>.
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base text-gray-500">
              Join our premium community of life-savers. Connect with donors instantly and manage blood stocks with our futuristic medical dashboard.
            </p>

            <div className="relative mx-auto flex h-14 w-full max-w-5xl items-center gap-2">
              <div ref={controlsWrapperRef} className="flex w-full items-center gap-2">
                <div className="flex w-[90%] items-center gap-1.5 md:gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveGroup(null)}
                    className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                      activeGroup === null
                        ? "bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                        : "glass text-gray-600 hover:border-primary-dark/30 hover:text-primary-dark"
                    }`}
                  >
                    All
                  </motion.button>
                  {bloodGroups.map((group) => (
                    <motion.button
                      key={group}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveGroup(group)}
                      className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                        activeGroup === group
                          ? "bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                          : "glass text-gray-600 hover:border-primary-dark/30 hover:text-primary-dark"
                      }`}
                    >
                      {group}
                    </motion.button>
                  ))}
                </div>

                <div className="flex w-[10%] items-center justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-[8px] glass text-gray-600 hover:border-primary-dark/30 hover:text-primary-dark"
                  >
                    <Search className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div ref={searchContainerRef} className="absolute inset-0 z-20 hidden items-center gap-2 px-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search cities or donor name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-[8px] border-none bg-white/80 pl-12 pr-4 font-medium text-gray-900 shadow-xl outline-none ring-2 ring-primary-dark/20 backdrop-blur-md focus:ring-primary-dark"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 opacity-[0.03]">
            <div className="liquid-bg absolute inset-0" />
          </div>
        </motion.div>

        {hasNoResults ? (
          <div className="mx-auto max-w-4xl rounded-[8px] border border-white/40 bg-white/20 p-8 text-center text-sm font-semibold text-gray-700">
            No active donors found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {donors.map((donor, index) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDonor(donor)}
                whileHover={{
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 15 }
                }}
                className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[8px] border border-white/40 bg-white/20 p-2 pr-4 shadow-card backdrop-blur-2xl transition-all duration-300 hover:border-primary-dark/40 hover:shadow-card"
              >
                <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/50" />

                <div className="relative z-10 flex w-full items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-primary-dark text-lg font-black text-white shadow-card">
                    {donor.group}
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
            ))}
          </div>
        )}
        {isDonorApiDown && (
          <p className="mx-auto mt-4 max-w-4xl text-center text-xs font-semibold text-amber-700">
            Live donor feed is reconnecting. Showing last available data.
          </p>
        )}
        {nextCursor && !hasNoResults && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
              className="rounded-[8px] bg-primary-dark px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Show More"}
            </button>
          </div>
        )}
      </div>

      <DonorModal donor={selectedDonor} onClose={() => setSelectedDonor(null)} />
    </section>
  );
}
