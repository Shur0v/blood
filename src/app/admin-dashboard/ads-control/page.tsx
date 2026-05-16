"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, RefreshCcw, Save, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

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

const emptyUnit = (): AdUnit => ({
  id: `ad-${Math.random().toString(36).slice(2, 9)}`,
  name: "",
  provider: "",
  adType: "script",
  scriptSrc: "",
  targetUrl: "",
  linkLabel: "",
  enabled: true,
  scope: "all_public_pages",
  placement: "head",
  notes: "",
});

export default function AdsControlPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adsRuntimeEnabled, setAdsRuntimeEnabled] = useState(true);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [persistedHash, setPersistedHash] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentHash = useMemo(
    () => JSON.stringify({ adsRuntimeEnabled, adUnits }),
    [adsRuntimeEnabled, adUnits]
  );
  const hasChanges = currentHash !== persistedHash;

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ads-settings", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
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

  const updateUnit = (index: number, patch: Partial<AdUnit>) => {
    setAdUnits((prev) => prev.map((unit, i) => (i === index ? { ...unit, ...patch } : unit)));
    setMessage(null);
  };

  const addUnit = () => {
    setAdUnits((prev) => [...prev, emptyUnit()]);
    setMessage(null);
  };

  const removeUnit = (id: string) => {
    setAdUnits((prev) => prev.filter((item) => item.id !== id));
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      for (const unit of adUnits) {
        if (!unit.name.trim() || !unit.provider.trim()) {
          throw new Error("Each ad row needs Name and Provider.");
        }
        if (unit.adType === "script" && !String(unit.scriptSrc || "").trim()) {
          throw new Error("Script ad needs Script URL.");
        }
        if (unit.adType === "smartlink" && !String(unit.targetUrl || "").trim()) {
          throw new Error("Smartlink ad needs Target URL.");
        }
        if (unit.adType === "native_banner") {
          if (!String(unit.scriptSrc || "").trim()) throw new Error("Native banner needs Script URL.");
          if (!String(unit.containerId || "").trim()) throw new Error("Native banner needs Container ID.");
          if (!String(unit.slotKey || "").trim()) throw new Error("Native banner needs serial slot (native-ad-1/2/3).");
        }
        if (unit.adType === "iframe_banner") {
          if (!String(unit.scriptSrc || "").trim()) throw new Error("IFrame banner needs Script URL.");
          if (!String(unit.bannerKey || "").trim()) throw new Error("IFrame banner needs Banner key.");
          if (!Number(unit.bannerWidth || 0) || !Number(unit.bannerHeight || 0)) {
            throw new Error("IFrame banner needs width and height.");
          }
        }
      }

      const res = await fetch("/api/admin/ads-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adsRuntimeEnabled, adUnits }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) throw new Error(payload?.message || "Failed to save ad settings.");

      const nextEnabled = Boolean(payload.data.adsRuntimeEnabled);
      const nextUnits = (payload.data.adUnits || []) as AdUnit[];
      setAdsRuntimeEnabled(nextEnabled);
      setAdUnits(nextUnits);
      setPersistedHash(JSON.stringify({ adsRuntimeEnabled: nextEnabled, adUnits: nextUnits }));
      setMessage("Ad runtime updated. Public pages refresh ad status automatically.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ad settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Ads Runtime Control</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage popunder and future ad scripts for all public pages with real-time switch control.
            </p>
          </div>
          <button
            onClick={() => void loadSettings()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">Global Runtime</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {adsRuntimeEnabled ? "Ads Enabled Across Public Pages" : "Ads Disabled Globally"}
            </p>
          </div>
          <button
            onClick={() => setAdsRuntimeEnabled((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${
              adsRuntimeEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {adsRuntimeEnabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            {adsRuntimeEnabled ? "Turn Off Ads" : "Turn On Ads"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {adUnits.map((unit, index) => (
          <div key={unit.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black text-gray-800 dark:text-gray-100">Ad Unit #{index + 1}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateUnit(index, { enabled: !unit.enabled })}
                  className={`rounded-lg px-3 py-1 text-xs font-black ${unit.enabled ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                >
                  {unit.enabled ? "Enabled" : "Disabled"}
                </button>
                <button
                  onClick={() => removeUnit(unit.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-xs font-black text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={unit.adType}
                onChange={(e) => updateUnit(index, { adType: e.target.value as "script" | "smartlink" | "native_banner" | "iframe_banner" })}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
              >
                <option value="script">Script Ad</option>
                <option value="smartlink">Smartlink</option>
                <option value="native_banner">Native Banner</option>
                <option value="iframe_banner">IFrame Banner</option>
              </select>
              <select
                value={unit.placement}
                onChange={(e) => updateUnit(index, { placement: e.target.value as AdUnit["placement"] })}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
              >
                <option value="head">Head</option>
                <option value="body_end">Body End</option>
                <option value="footer_inline">Footer Inline</option>
                <option value="hero_center">Hero Center</option>
                <option value="donor_cards_mix">Donor Cards Mix</option>
                <option value="community_image_slot">Community Image Slot</option>
              </select>
              <input
                value={unit.name}
                onChange={(e) => updateUnit(index, { name: e.target.value })}
                placeholder="Ad Name"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
              />
              <input
                value={unit.provider}
                onChange={(e) => updateUnit(index, { provider: e.target.value })}
                placeholder="Provider"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
              />
              {unit.adType === "script" ? (
                <input
                  value={unit.scriptSrc || ""}
                  onChange={(e) => updateUnit(index, { scriptSrc: e.target.value })}
                  placeholder="Script URL (https://...)"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                />
              ) : unit.adType === "smartlink" ? (
                <>
                  <input
                    value={unit.targetUrl || ""}
                    onChange={(e) => updateUnit(index, { targetUrl: e.target.value })}
                    placeholder="Smartlink URL (https://...)"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                  <input
                    value={unit.linkLabel || ""}
                    onChange={(e) => updateUnit(index, { linkLabel: e.target.value })}
                    placeholder="Link Label (e.g. Sponsored Offer)"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                </>
              ) : unit.adType === "native_banner" ? (
                <>
                  <input
                    value={unit.scriptSrc || ""}
                    onChange={(e) => updateUnit(index, { scriptSrc: e.target.value })}
                    placeholder="Native script URL (https://.../invoke.js)"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                  <input
                    value={unit.containerId || ""}
                    onChange={(e) => updateUnit(index, { containerId: e.target.value })}
                    placeholder="Container ID (e.g. container-8887...)"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                  <select
                    value={unit.slotKey || "native-ad-1"}
                    onChange={(e) => updateUnit(index, { slotKey: e.target.value as AdUnit["slotKey"] })}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  >
                    <option value="native-ad-1">Serial: native-ad-1</option>
                    <option value="native-ad-2">Serial: native-ad-2</option>
                    <option value="native-ad-3">Serial: native-ad-3</option>
                  </select>
                </>
              ) : (
                <>
                  <input
                    value={unit.scriptSrc || ""}
                    onChange={(e) => updateUnit(index, { scriptSrc: e.target.value })}
                    placeholder="Banner script URL (https://.../invoke.js)"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                  <input
                    value={unit.bannerKey || ""}
                    onChange={(e) => updateUnit(index, { bannerKey: e.target.value })}
                    placeholder="Banner key"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                  <input
                    type="number"
                    value={unit.bannerWidth || 320}
                    onChange={(e) => updateUnit(index, { bannerWidth: Number(e.target.value || 0) })}
                    placeholder="Width"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                  <input
                    type="number"
                    value={unit.bannerHeight || 50}
                    onChange={(e) => updateUnit(index, { bannerHeight: Number(e.target.value || 0) })}
                    placeholder="Height"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
                  />
                </>
              )}
              <input
                value={unit.notes || ""}
                onChange={(e) => updateUnit(index, { notes: e.target.value })}
                placeholder="Notes (optional)"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm md:col-span-2 dark:border-gray-700 dark:bg-[#0f1115]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={addUnit}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold dark:border-gray-700 dark:bg-[#1a1b23]"
        >
          <Plus className="h-4 w-4" />
          Add New Ad Unit
        </button>
        <button
          onClick={() => void save()}
          disabled={saving || loading || !hasChanges}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Ad Settings"}
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    </div>
  );
}
