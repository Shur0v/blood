"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import DonorModal from "./DonorModal";
import { maskPhoneTail } from "../lib/phoneMask";
import { normalizeOrganName } from "../lib/organCatalog";
import OrganIcon from "./OrganIcon";

type LandingMode = "blood" | "organ";

interface CityLandingDonorGridProps {
  mode: LandingMode;
  city: string;
  country: string;
}

interface DonorCard {
  id: string;
  name: string;
  phone: string;
  maskedPhone: string;
  location: string;
  group: string;
  bloodGroup?: string;
  verificationStatus?: string | null;
  hemoglobin?: string | null;
  lastDonationDate?: string | null;
}

export default function CityLandingDonorGrid({ mode, city, country }: CityLandingDonorGridProps) {
  const [cards, setCards] = useState<DonorCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<DonorCard | null>(null);

  const endpoint = mode === "blood" ? "/api/public/donors" : "/api/public/organ-donors";
  const fetchCards = async (cursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "16",
        viewerCity: city,
        viewerCountry: country,
      });
      if (cursor) {
        params.set("cursor", cursor);
      }
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        return;
      }

      const mapped: DonorCard[] = (payload.data || []).map((row: any) => {
        const isBlood = mode === "blood";
        const organName = isBlood ? "" : normalizeOrganName(row.organ_type || "") || "Kidney";
        return {
          id: row.id,
          name: row.name,
          phone: row.mobile,
          maskedPhone: maskPhoneTail(row.mobile),
          location: `${row.location_city}, ${row.location_country}`,
          group: isBlood ? row.blood_group : organName,
          bloodGroup: isBlood ? undefined : row.blood_group || "N/A",
          verificationStatus: row.verification_status ?? null,
          hemoglobin: row.hemoglobin ?? null,
          lastDonationDate: row.last_donation_date ?? null,
        };
      });

      setCards((prev) => (cursor ? [...prev, ...mapped] : mapped));
      setNextCursor(payload.pagination?.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCards([]);
    setNextCursor(null);
    void fetchCards();
  }, [mode, city, country]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24">
      <div className="mb-8 rounded-xl border border-border/20 bg-white/70 p-6 backdrop-blur">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">
          {mode === "blood" ? "Urgent Blood Donation" : "Emergency Organ Donation"} in {city}
        </h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Priority results from {city}, {country}. If not enough, nearest country/global verified donors are shown.
        </p>
      </div>

      {cards.length === 0 && !loading ? (
        <div className="rounded-xl border border-border/20 bg-white/60 p-8 text-center text-sm font-semibold text-gray-700">
          No donors available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => (
            <motion.div
              key={`${card.id}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setSelectedDonor(card)}
              className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[8px] border border-white/40 bg-white/30 p-2 pr-4 shadow-card backdrop-blur-2xl transition-all duration-300 hover:border-primary-dark/40 hover:shadow-card"
            >
              <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/50" />
              <div className="relative z-10 flex w-full items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-primary-dark text-lg font-black text-white shadow-card">
                  {mode === "blood" ? card.group : <OrganIcon organ={card.group} className="h-6 w-6" />}
                </div>
                <div className="ml-3 flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-sm font-bold tracking-tight text-gray-900">{card.name}</h3>
                    {mode === "organ" && (
                      <span className="ml-2 rounded bg-primary-dark/10 px-1.5 py-0.5 text-[10px] font-black text-primary-dark">
                        {card.bloodGroup}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-col text-[10px] font-medium text-gray-600">
                    <span className="truncate">{card.maskedPhone}</span>
                    <span className="truncate opacity-70">{card.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void fetchCards(nextCursor)}
            disabled={loading}
            className="rounded-[8px] bg-primary-dark px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Show More"}
          </button>
        </div>
      )}

      <DonorModal donor={selectedDonor as any} onClose={() => setSelectedDonor(null)} />
    </section>
  );
}
