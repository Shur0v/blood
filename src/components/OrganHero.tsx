import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { gsap } from "gsap";
import DonorModal from "./DonorModal";
import useViewerGeo from "./useViewerGeo";
import { maskPhoneTail } from "../lib/phoneMask";
import { ORGAN_CATALOG, normalizeOrganName } from "../lib/organCatalog";
import OrganIcon from "./OrganIcon";

const organs = ORGAN_CATALOG.map((name) => ({ name }));

const bloodGroups = ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"];

interface OrganDonor {
  id: string;
  name: string;
  phone: string;
  maskedPhone: string;
  organ: string;
  bloodGroup: string;
  location: string;
  group?: string;
  verificationStatus?: string | null;
  hemoglobin?: string | null;
  lastDonationDate?: string | null;
}

interface OrganDonorApiResponse {
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    mobile: string;
    organ_type: string;
    blood_group: string | null;
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

export default function OrganHero({ forcedCountry }: { forcedCountry?: string }) {
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null);
  const [activeBloodGroup, setActiveBloodGroup] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<OrganDonor | null>(null);
  const [donors, setDonors] = useState<OrganDonor[]>([]);
  const [totalOrganDonors, setTotalOrganDonors] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const controlsWrapperRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const normalizedSearch = searchQuery.trim();
  const viewerGeo = useViewerGeo();
  const buildBaseParams = () => {
    const params = new URLSearchParams({ limit: "16" });
    if (forcedCountry) {
      params.set("country", forcedCountry);
    }
    if (activeOrgan) {
      params.set("organ", activeOrgan);
    }
    if (activeBloodGroup) {
      params.set("bloodGroup", activeBloodGroup);
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
    rows: NonNullable<OrganDonorApiResponse["data"]>,
  ): OrganDonor[] =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.mobile,
      maskedPhone: maskPhoneTail(row.mobile),
      organ: normalizeOrganName(row.organ_type || "") || "Kidney",
      bloodGroup: row.blood_group || "N/A",
      location: `${row.location_city}, ${row.location_country}`,
      verificationStatus: row.verification_status ?? null,
      hemoglobin: row.hemoglobin ?? null,
      lastDonationDate: row.last_donation_date ?? null,
    }));

  useEffect(() => {
    const controls = animate(count, totalOrganDonors, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [count, totalOrganDonors]);

  useEffect(() => {
    if (isSearchOpen) {
      gsap.to(controlsWrapperRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        display: "none",
        ease: "power2.inOut"
      });

      gsap.fromTo(searchContainerRef.current,
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

      gsap.fromTo(controlsWrapperRef.current,
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

        const res = await fetch(`/api/public/organ-donors?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await res.json()) as OrganDonorApiResponse;
        if (!res.ok || !payload.success) {
          setDonors([]);
          setTotalOrganDonors(0);
          setNextCursor(null);
          return;
        }

        const mapped = mapRows(payload.data || []);

        setDonors(mapped);
        setNextCursor(payload.pagination?.nextCursor ?? null);
        setTotalOrganDonors(Number(payload.meta?.globalTotal ?? payload.pagination?.total ?? 0));
      } catch (error) {
        setDonors([]);
        setTotalOrganDonors(0);
        setNextCursor(null);
      }
    };

    void loadDonors();
  }, [activeOrgan, activeBloodGroup, normalizedSearch, viewerGeo.city, viewerGeo.country]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = buildBaseParams();
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/public/organ-donors?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await res.json()) as OrganDonorApiResponse;
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
                <span className="text-base font-bold lowercase tracking-[2px] text-white">organ donors</span>
              </div>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Give the Gift of <span className="text-primary-dark">Life</span>.
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base text-gray-500">
              Connect with organ donors instantly. Our platform facilitates the matching process for life-saving transplants with utmost care and security.
              {forcedCountry ? ` Showing active organ donor results for ${forcedCountry}.` : ""}
            </p>

            <div className="relative mx-auto flex flex-col gap-4 w-full max-w-5xl">
              <div className="flex w-full items-center gap-1.5 md:gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveOrgan(null)}
                  data-analytics-component="Organ Filter All"
                  className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                    activeOrgan === null
                      ? "bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                      : "glass text-gray-600 hover:border-primary-dark/30 hover:text-primary-dark"
                  }`}
                >
                  All
                </motion.button>
                {organs.map((organ) => (
                  <motion.button
                    key={organ.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveOrgan(organ.name)}
                    data-analytics-component={`Organ Filter ${organ.name}`}
                    className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                      activeOrgan === organ.name
                        ? "bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                        : "glass text-gray-600 hover:border-primary-dark/30 hover:text-primary-dark"
                    }`}
                  >
                    {organ.name}
                  </motion.button>
                ))}
              </div>

              <div className="relative flex h-14 w-full items-center gap-2 overflow-hidden">
                <div ref={controlsWrapperRef} className="flex w-full items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveBloodGroup(null)}
                      data-analytics-component="Organ Blood Filter All"
                      className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                        activeBloodGroup === null
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
                        onClick={() => setActiveBloodGroup(group)}
                        data-analytics-component={`Organ Blood Filter ${group}`}
                        className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                          activeBloodGroup === group
                            ? "bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                            : "glass text-gray-600 hover:border-primary-dark/30 hover:text-primary-dark"
                        }`}
                      >
                        {group}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex shrink-0 items-center justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsSearchOpen(true)}
                      data-analytics-component="Organ Search Open"
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
                    data-analytics-component="Organ Search Close"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-primary-dark text-white shadow-lg shadow-primary-dark/30"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 opacity-[0.03]">
            <div className="liquid-bg absolute inset-0" />
          </div>
        </motion.div>

        {donors.length === 0 ? (
          <div className="mx-auto max-w-4xl rounded-[8px] border border-white/40 bg-white/20 p-8 text-center text-sm font-semibold text-gray-700">
            No organ donors found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {donors.map((donor, index) => (
              <motion.div
                key={`${donor.id}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDonor({ ...donor, group: donor.organ })}
                data-analytics-component="Organ Donor Card Open"
                whileHover={{
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 15 }
                }}
                className="group relative flex items-center gap-3 cursor-pointer overflow-hidden rounded-[8px] border border-white/40 bg-white/20 p-2 pr-4 shadow-card backdrop-blur-2xl transition-all duration-300 hover:border-primary-dark/40 hover:shadow-card"
              >
                <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/50" />

                <div className="relative z-10 flex w-full items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-primary-dark text-lg font-black text-white shadow-card">
                    <OrganIcon organ={donor.organ} className="h-6 w-6" />
                  </div>

                  <div className="ml-3 flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-bold tracking-tight text-gray-900">{donor.name}</h3>
                      <span className="text-[10px] font-black text-primary-dark bg-primary-dark/10 px-1.5 py-0.5 rounded ml-2">{donor.bloodGroup}</span>
                    </div>
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
        {nextCursor && donors.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
              data-analytics-component="Organ Donor Show More"
              className="rounded-[8px] bg-primary-dark px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Show More"}
            </button>
          </div>
        )}
      </div>

      <DonorModal donor={selectedDonor as any} onClose={() => setSelectedDonor(null)} />
    </section>
  );
}
