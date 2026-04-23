"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, MapPin, PhoneCall, X } from "lucide-react";
import useViewerGeo from "./useViewerGeo";
import { maskPhoneTail } from "../lib/phoneMask";

interface OrganRequestRow {
  id: string;
  name: string;
  contact: string;
  organ_type: string;
  location_city: string;
  location_country: string;
  medical_note: string;
  created_at: string;
}

interface OrganRequestApiResponse {
  success: boolean;
  data?: OrganRequestRow[];
  pagination?: {
    nextCursor: string | null;
    total: number;
    limit: number;
  };
  message?: string;
}

const extractShortNote = (raw: string): string => {
  const note = raw
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("Location:") &&
        !line.startsWith("Blood Group:") &&
        !line.startsWith("Email:") &&
        !line.startsWith("Documents:") &&
        !line.startsWith("Document:") &&
        !line.startsWith("Uploaded Files:") &&
        !/^https?:\/\//i.test(line.trim()),
    )
    .join(" ")
    .trim();
  return note.length > 180 ? `${note.slice(0, 180)}...` : note;
};

export default function ApprovedOrganRequests() {
  const [rows, setRows] = useState<OrganRequestRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<OrganRequestRow | null>(null);
  const viewerGeo = useViewerGeo();

  const loadRows = async (cursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "16" });
      if (cursor) params.set("cursor", cursor);
      const canApplyCountryFilter = Boolean(viewerGeo.country && (viewerGeo.city || viewerGeo.source === "geo"));
      if (canApplyCountryFilter) {
        params.set("viewerCountry", viewerGeo.country!);
      }

      const res = await fetch(`/api/public/organ-requests?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await res.json()) as OrganRequestApiResponse;
      if (!res.ok || !payload.success) {
        return;
      }

      const incoming = payload.data || [];
      setRows((prev) => (cursor ? [...prev, ...incoming] : incoming));
      setNextCursor(payload.pagination?.nextCursor ?? null);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, [viewerGeo.city, viewerGeo.country, viewerGeo.source]);

  const totalLabel = useMemo(() => {
    if (initialLoading) return "Loading approved requests...";
    return rows.length > 0 ? `${rows.length} approved request${rows.length > 1 ? "s" : ""} visible` : "No approved requests yet";
  }, [initialLoading, rows.length]);

  if (!initialLoading && rows.length === 0) {
    return null;
  }

  return (
    <>
    <section className="mx-auto w-full max-w-7xl px-4 pb-16">
      <div className="mb-8 rounded-[8px] border border-border/20 bg-white/70 p-6 backdrop-blur-sm">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Approved Organ Requests</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">
          These are verified requests approved by the user management team and ready for donor response.
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary-dark">{totalLabel}</p>
      </div>

      {rows.length === 0 && !initialLoading ? (
        <div className="rounded-[8px] border border-border/20 bg-white/60 p-8 text-center text-sm font-semibold text-gray-700">
          Approved requests will appear here after dashboard approval.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((row, index) => (
            <motion.article
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[8px] border border-white/40 bg-white/30 p-5 shadow-card backdrop-blur-2xl"
              onClick={() => setSelectedRequest(row)}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-dark">Requested Organ</p>
                  <h3 className="mt-1 text-xl font-black text-gray-900">{row.organ_type}</h3>
                </div>
                <span className="rounded-full bg-green-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-700">
                  Approved
                </span>
              </div>

              <div className="space-y-2 text-sm font-medium text-gray-700">
                <p className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-primary-dark" />
                  {maskPhoneTail(row.contact)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-dark" />
                  {row.location_city}, {row.location_country}
                </p>
              </div>

              {row.medical_note?.trim() && (
                <p className="mt-4 rounded-xl bg-white/60 p-3 text-xs font-semibold leading-relaxed text-gray-700">
                  {extractShortNote(row.medical_note)}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      )}

      {nextCursor && rows.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void loadRows(nextCursor)}
            disabled={loading}
            className="rounded-[8px] bg-primary-dark px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Show More"}
          </button>
        </div>
      )}
    </section>
    {selectedRequest && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-[8px] border border-white/30 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-dark">Requested Organ</p>
              <h3 className="mt-1 text-2xl font-black text-gray-900">{selectedRequest.organ_type}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="rounded-full bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm font-semibold text-gray-700">
            <p>
              <span className="font-black text-gray-900">Recipient:</span> {selectedRequest.name}
            </p>
            <p className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary-dark" />
              {selectedRequest.contact}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-dark" />
              {selectedRequest.location_city}, {selectedRequest.location_country}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-dark" />
              {new Date(selectedRequest.created_at).toLocaleDateString()}
            </p>
          </div>

          {selectedRequest.medical_note?.trim() && (
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs font-semibold leading-relaxed text-gray-700">
              {extractShortNote(selectedRequest.medical_note)}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
