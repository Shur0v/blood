"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, RefreshCcw, Save, ToggleLeft, ToggleRight, X } from "lucide-react";

type AdUnit = {
  id: string;
  name: string;
  provider: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc?: string;
  targetUrl?: string;
  linkLabel?: string;
  containerId?: string;
  slotKey?: "native-ad-1" | "native-ad-2" | "native-ad-3";
  bannerKey?: string;
  bannerWidth?: number;
  bannerHeight?: number;
  enabled: boolean;
  scope: "all_public_pages";
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
  notes?: string;
};

const AD_TYPE_LABEL: Record<AdUnit["adType"], string> = {
  script: "Script Ad",
  smartlink: "Smartlink",
  native_banner: "Native Banner",
  iframe_banner: "Banner (IFrame)",
};

const PLACEMENT_LABEL: Record<AdUnit["placement"], string> = {
  head: "Head (top script)",
  body_end: "Body End (bottom script)",
  footer_inline: "Footer Area",
  hero_center: "Hero Center",
  donor_cards_mix: "Donor Cards (after Show More)",
  community_image_slot: "Community Image Slot",
};

export default function AdsControlPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adsRuntimeEnabled, setAdsRuntimeEnabled] = useState(true);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [persistedHash, setPersistedHash] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<AdUnit | null>(null);

  const currentHash = useMemo(() => JSON.stringify({ adsRuntimeEnabled, adUnits }), [adsRuntimeEnabled, adUnits]);
  const hasChanges = currentHash !== persistedHash;

  const persistSettings = async (nextEnabled: boolean, nextUnits: AdUnit[]) => {
    validateUnits(nextUnits);
    const res = await fetch("/api/admin/ads-settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adsRuntimeEnabled: nextEnabled, adUnits: nextUnits }),
    });
    const payload = await res.json();
    if (!res.ok || !payload?.success) throw new Error(payload?.message || "Failed to save ad settings.");
    const savedEnabled = Boolean(payload.data.adsRuntimeEnabled);
    const savedUnits = (payload.data.adUnits || []) as AdUnit[];
    setAdsRuntimeEnabled(savedEnabled);
    setAdUnits(savedUnits);
    setPersistedHash(JSON.stringify({ adsRuntimeEnabled: savedEnabled, adUnits: savedUnits }));
  };

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ads-settings", { method: "GET", credentials: "include", cache: "no-store" });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.message || "Failed to load ad settings.");
      const nextEnabled = Boolean(payload.data.adsRuntimeEnabled);
      const nextUnits = (payload.data.adUnits || []) as AdUnit[];
      setAdsRuntimeEnabled(nextEnabled);
      setAdUnits(nextUnits);
      setPersistedHash(JSON.stringify({ adsRuntimeEnabled: nextEnabled, adUnits: nextUnits }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ad settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const validateUnits = (units: AdUnit[]) => {
    for (const unit of units) {
      if (!unit.name.trim() || !unit.provider.trim()) throw new Error("Each ad unit needs Name and Provider.");
      if (unit.adType === "script" && !String(unit.scriptSrc || "").trim()) throw new Error(`${unit.name}: Script URL required.`);
      if (unit.adType === "smartlink" && !String(unit.targetUrl || "").trim()) throw new Error(`${unit.name}: Smartlink URL required.`);
      if (unit.adType === "native_banner") {
        if (!String(unit.scriptSrc || "").trim()) throw new Error(`${unit.name}: Native script URL required.`);
        if (!String(unit.containerId || "").trim()) throw new Error(`${unit.name}: Native container ID required.`);
        if (!String(unit.slotKey || "").trim()) throw new Error(`${unit.name}: Native serial required.`);
      }
      if (unit.adType === "iframe_banner") {
        if (!String(unit.scriptSrc || "").trim()) throw new Error(`${unit.name}: Banner script URL required.`);
        if (!String(unit.bannerKey || "").trim()) throw new Error(`${unit.name}: Banner key required.`);
        if (!Number(unit.bannerWidth || 0) || !Number(unit.bannerHeight || 0)) throw new Error(`${unit.name}: Banner width/height required.`);
      }
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await persistSettings(adsRuntimeEnabled, adUnits);
      setMessage("Saved. Live pages will refresh this automatically.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ad settings.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...adUnits[index] });
  };

  const closeEdit = () => {
    setEditingIndex(null);
    setDraft(null);
  };

  const applyEdit = () => {
    if (editingIndex === null || !draft || saving) return;
    const next = [...adUnits];
    next[editingIndex] = { ...draft };
    setSaving(true);
    setError(null);
    setMessage(null);
    void (async () => {
      try {
        await persistSettings(adsRuntimeEnabled, next);
        setMessage("Ad unit updated and saved.");
        closeEdit();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update ad unit.");
      } finally {
        setSaving(false);
      }
    })();
  };

  const toggleGlobalRuntimeNow = async () => {
    if (saving) return;
    const nextEnabled = !adsRuntimeEnabled;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await persistSettings(nextEnabled, adUnits);
      setMessage(
        nextEnabled
          ? "All ads are ON now. Public pages will show managed ads."
          : "All ads are OFF now. Public pages will return to default design."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update global runtime.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSingleUnitNow = async (index: number) => {
    if (saving) return;
    const next = [...adUnits];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await persistSettings(adsRuntimeEnabled, next);
      setMessage(`${next[index].name} ${next[index].enabled ? "enabled" : "disabled"} and saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ad unit status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Ad Control Center</h2>
            <p className="mt-1 text-sm text-gray-500">Simple control for every ad slot. Edit each ad from modal, then save once.</p>
          </div>
          <button onClick={() => void loadSettings()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">Global Switch</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{adsRuntimeEnabled ? "Ads ON (Live)" : "Ads OFF (Default Design)"}</p>
          </div>
          <button onClick={() => void toggleGlobalRuntimeNow()} disabled={saving || loading} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-60 ${adsRuntimeEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {adsRuntimeEnabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            {adsRuntimeEnabled ? "Turn OFF All Ads" : "Turn ON All Ads"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adUnits.map((unit, index) => (
          <div key={unit.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{unit.name}</p>
                <p className="text-xs font-semibold text-gray-500">{AD_TYPE_LABEL[unit.adType]} • {PLACEMENT_LABEL[unit.placement]}</p>
              </div>
              <button
                onClick={() => void toggleSingleUnitNow(index)}
                disabled={saving || loading}
                className={`rounded-lg px-2 py-1 text-xs font-black disabled:opacity-60 ${unit.enabled ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
              >
                {unit.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <p><span className="font-bold">Provider:</span> {unit.provider}</p>
              {unit.adType === "smartlink" && <p className="truncate"><span className="font-bold">URL:</span> {unit.targetUrl || "-"}</p>}
              {(unit.adType === "script" || unit.adType === "native_banner" || unit.adType === "iframe_banner") && (
                <p className="truncate"><span className="font-bold">Script:</span> {unit.scriptSrc || "-"}</p>
              )}
            </div>
            <button onClick={() => openEdit(index)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => void save()} disabled={saving || loading || !hasChanges} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60">
          {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {message && <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"><CheckCircle2 className="h-4 w-4" />{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      {editingIndex !== null && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-[#11131a]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Edit Ad Unit</h3>
              <button onClick={closeEdit} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]" />
              <input value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} placeholder="Provider" className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]" />
              <select value={draft.adType} onChange={(e) => setDraft({ ...draft, adType: e.target.value as AdUnit["adType"] })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]">
                <option value="script">Script Ad</option>
                <option value="smartlink">Smartlink</option>
                <option value="native_banner">Native Banner</option>
                <option value="iframe_banner">Banner (IFrame)</option>
              </select>
              <select value={draft.placement} onChange={(e) => setDraft({ ...draft, placement: e.target.value as AdUnit["placement"] })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]">
                <option value="head">Head (top script)</option>
                <option value="body_end">Body End (bottom script)</option>
                <option value="footer_inline">Footer Area</option>
                <option value="hero_center">Hero Center</option>
                <option value="donor_cards_mix">Donor Cards (after Show More)</option>
                <option value="community_image_slot">Community Image Slot</option>
              </select>

              {(draft.adType === "script" || draft.adType === "native_banner" || draft.adType === "iframe_banner") && (
                <input value={draft.scriptSrc || ""} onChange={(e) => setDraft({ ...draft, scriptSrc: e.target.value })} placeholder="Script URL" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]" />
              )}
              {draft.adType === "smartlink" && (
                <>
                  <input value={draft.targetUrl || ""} onChange={(e) => setDraft({ ...draft, targetUrl: e.target.value })} placeholder="Smartlink URL" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]" />
                  <input value={draft.linkLabel || ""} onChange={(e) => setDraft({ ...draft, linkLabel: e.target.value })} placeholder="Button Label" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]" />
                </>
              )}
              {draft.adType === "native_banner" && (
                <>
                  <input value={draft.containerId || ""} onChange={(e) => setDraft({ ...draft, containerId: e.target.value })} placeholder="Container ID" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]" />
                  <select value={draft.slotKey || "native-ad-1"} onChange={(e) => setDraft({ ...draft, slotKey: e.target.value as AdUnit["slotKey"] })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]">
                    <option value="native-ad-1">native-ad-1</option>
                    <option value="native-ad-2">native-ad-2</option>
                    <option value="native-ad-3">native-ad-3</option>
                  </select>
                </>
              )}
              {draft.adType === "iframe_banner" && (
                <>
                  <input value={draft.bannerKey || ""} onChange={(e) => setDraft({ ...draft, bannerKey: e.target.value })} placeholder="Banner Key" className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]" />
                  <input type="number" value={draft.bannerWidth || 0} onChange={(e) => setDraft({ ...draft, bannerWidth: Number(e.target.value || 0) })} placeholder="Width" className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]" />
                  <input type="number" value={draft.bannerHeight || 0} onChange={(e) => setDraft({ ...draft, bannerHeight: Number(e.target.value || 0) })} placeholder="Height" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]" />
                </>
              )}
              <input value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes" className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setDraft({ ...draft, enabled: !draft.enabled })} className={`rounded-xl px-4 py-2 text-sm font-black ${draft.enabled ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                {draft.enabled ? "Enabled" : "Disabled"}
              </button>
              <div className="flex gap-2">
                <button onClick={closeEdit} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold">Cancel</button>
                <button onClick={applyEdit} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
