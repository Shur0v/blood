import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import DonorModal from "./DonorModal";
import useViewerGeo from "./useViewerGeo";
import { maskPhoneTail } from "../lib/phoneMask";

interface PublicDonorRow {
  id: string;
  name: string;
  blood_group: string;
  location_city: string;
  location_country: string;
  mobile: string;
  verification_status?: string | null;
  hemoglobin?: string | null;
  last_donation_date?: string | null;
}

interface PublicDonorApiResponse {
  success: boolean;
  data?: PublicDonorRow[];
  pagination?: {
    nextCursor: string | null;
  };
}

interface FloatingDonor {
  id: string;
  group: string;
  name: string;
  location: string;
  country: string;
  phone: string;
  maskedPhone: string;
  verificationStatus?: string | null;
  hemoglobin?: string | null;
  lastDonationDate?: string | null;
}

const DEVICE_SEED_KEY = "bloodnet_device_seed_v1";

const xmur3 = (str: string) => {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = <T,>(arr: T[], seedText: string): T[] => {
  const next = [...arr];
  const hash = xmur3(seedText);
  const rng = mulberry32(hash());
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const getDeviceSeed = () => {
  if (typeof window === "undefined") return "server-seed";
  try {
    const existing = localStorage.getItem(DEVICE_SEED_KEY);
    if (existing && existing.trim().length > 0) {
      return existing;
    }
    const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_SEED_KEY, generated);
    return generated;
  } catch {
    return "fallback-seed";
  }
};

export default function FloatingDonorTags() {
  const viewerGeo = useViewerGeo();
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [pool, setPool] = useState<FloatingDonor[]>([]);
  const [seed, setSeed] = useState("initial-seed");

  useEffect(() => {
    setSeed(getDeviceSeed());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const toFloating = (row: PublicDonorRow): FloatingDonor => ({
      id: row.id,
      group: row.blood_group,
      name: row.name,
      location: row.location_city,
      country: row.location_country,
      phone: row.mobile,
      maskedPhone: maskPhoneTail(row.mobile),
      verificationStatus: row.verification_status ?? null,
      hemoglobin: row.hemoglobin ?? null,
      lastDonationDate: row.last_donation_date ?? null,
    });

    const fetchRealtimeDonors = async () => {
      try {
        const collected: PublicDonorRow[] = [];
        let cursor: string | null = null;
        let pageCount = 0;

        while (pageCount < 4 && collected.length < 64) {
          const params = new URLSearchParams({ limit: "16" });
          if (cursor) params.set("cursor", cursor);
          if (viewerGeo.city) params.set("viewerCity", viewerGeo.city);
          if (viewerGeo.country && (viewerGeo.city || viewerGeo.source === "geo")) {
            params.set("viewerCountry", viewerGeo.country);
          }

          const res = await fetch(`/api/public/donors?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });
          const payload = (await res.json()) as PublicDonorApiResponse;
          if (!res.ok || !payload.success) break;

          const rows = payload.data || [];
          collected.push(...rows);
          cursor = payload.pagination?.nextCursor || null;
          pageCount += 1;
          if (!cursor || rows.length === 0) break;
        }

        if (cancelled) return;

        const mapped = collected.map(toFloating);
        if (mapped.length === 0) {
          setPool([]);
          return;
        }

        const normalizedViewerCountry = viewerGeo.country?.trim().toLowerCase();
        const countryMatches = normalizedViewerCountry
          ? mapped.filter((d) => d.country?.trim().toLowerCase() === normalizedViewerCountry)
          : [];
        const rest = normalizedViewerCountry
          ? mapped.filter((d) => d.country?.trim().toLowerCase() !== normalizedViewerCountry)
          : mapped;

        const prioritized = countryMatches.length > 0
          ? [
              ...shuffleWithSeed(countryMatches, `${seed}-local`),
              ...shuffleWithSeed(rest, `${seed}-global`),
            ]
          : shuffleWithSeed(mapped, `${seed}-all`);

        setPool(prioritized);
      } catch {
        if (!cancelled) setPool([]);
      }
    };

    void fetchRealtimeDonors();
    return () => {
      cancelled = true;
    };
  }, [seed, viewerGeo.city, viewerGeo.country]);

  const rows = useMemo(() => {
    if (pool.length === 0) return [[], [], [], [], []] as FloatingDonor[][];
    const rowCount = 5;
    const rowSize = Math.min(Math.max(Math.ceil(pool.length / rowCount), 8), 16);
    return Array.from({ length: rowCount }, (_, rowIndex) =>
      Array.from({ length: rowSize }, (_, cardIndex) => {
        const idx = (rowIndex * 7 + cardIndex) % pool.length;
        return pool[idx];
      }),
    );
  }, [pool]);

  return (
    <section className="relative overflow-hidden py-24">
      {/* Background Decorative Elements - Centered with side fade */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[500px] w-[500px] rounded-full bg-primary-dark/10 blur-[120px]" />
        <div className="absolute h-[700px] w-[700px] rounded-full bg-primary/5 blur-[160px]" />
      </div>
      
      {/* Side Fades to ensure opacity 0 on left/right */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white to-transparent z-0" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white to-transparent z-0" />

      <div className="container mx-auto px-4 mb-12 text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight text-gray-900 uppercase"
        >
          Realtime active donor ready to help
        </motion.h2>
        <div className="mt-2 h-1.5 w-24 bg-primary-dark mx-auto rounded-full" />
      </div>

      {pool.length === 0 ? (
        <div className="relative z-10 mx-auto max-w-4xl rounded-[10px] border border-white/40 bg-white/20 p-8 text-center text-sm font-semibold text-gray-700 backdrop-blur-xl">
          Live donor stream is preparing nearby profiles.
        </div>
      ) : (
        <div className="relative z-10 flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          {rows.map((row, index) => (
            <MarqueeRow
              key={`row-${index}`}
              donors={row}
              onDonorClick={setSelectedDonor}
            />
          ))}
        </div>
      )}

      <DonorModal 
        donor={selectedDonor} 
        onClose={() => setSelectedDonor(null)} 
      />
    </section>
  );
}

function MarqueeRow({ donors, onDonorClick }: { donors: FloatingDonor[]; onDonorClick: (donor: FloatingDonor) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!rowRef.current || donors.length === 0) return;

    const row = rowRef.current;
    const totalWidth = row.scrollWidth / 2;
    const randomSpeed = gsap.utils.random(60, 100); // Slower speeds (higher duration)

    animationRef.current = gsap.to(row, {
      x: -totalWidth,
      duration: randomSpeed,
      ease: "none",
      repeat: -1,
    });

    return () => {
      animationRef.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => animationRef.current?.pause();
  const handleMouseLeave = () => animationRef.current?.play();

  return (
    <div className="flex overflow-hidden py-6">
      <div 
        ref={rowRef} 
        className="flex shrink-0 gap-6 px-4"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
      >
        {/* Double the items for seamless loop */}
        {[...donors, ...donors].map((donor, index) => (
          <DonorTag key={index} {...donor} onClick={() => onDonorClick(donor)} />
        ))}
      </div>
    </div>
  );
}

function DonorTag({ group, name, location, maskedPhone, onClick }: { group: string; name: string; location: string; maskedPhone: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group flex min-w-[240px] sm:min-w-[280px] cursor-pointer items-center gap-3 sm:gap-4 rounded-full border border-white/40 bg-white/20 p-2 pr-5 sm:pr-8 shadow-card backdrop-blur-2xl transition-all duration-300 hover:border-primary-dark/40 hover:shadow-card hover:-translate-y-1"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-dark text-lg font-black text-white shadow-card">
        {group}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-bold text-gray-900">{name}</span>
        <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          <span>{location}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>{maskedPhone}</span>
        </div>
      </div>
    </div>
  );
}
