"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Paintbrush, RefreshCcw, Save } from "lucide-react";
import { DEFAULT_UI_THEME, type UiThemeKey, UI_THEME_KEYS, UI_THEME_LABELS } from "@/src/lib/uiTheme";

const THEME_DESCRIPTIONS: Record<UiThemeKey, string> = {
  classic: "Current reviewed production style (unchanged).",
  midnight: "Deep navy + red contrast for a premium dark command-center mood.",
  ocean: "Cool blue + teal palette for medical clarity and calm readability.",
  emerald: "Green + slate palette focused on trust and accessibility.",
};

export default function ThemeControlPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<UiThemeKey>(DEFAULT_UI_THEME);
  const [persistedTheme, setPersistedTheme] = useState<UiThemeKey>(DEFAULT_UI_THEME);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(() => selectedTheme !== persistedTheme, [selectedTheme, persistedTheme]);

  const applyTheme = (theme: UiThemeKey) => {
    document.documentElement.setAttribute("data-theme", theme);
  };

  const fetchTheme = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load current theme.");
      }

      const theme = (payload?.data?.uiTheme || DEFAULT_UI_THEME) as UiThemeKey;
      setSelectedTheme(theme);
      setPersistedTheme(theme);
      applyTheme(theme);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load theme.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTheme();
  }, []);

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  const saveTheme = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uiTheme: selectedTheme }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update theme.");
      }

      setPersistedTheme(selectedTheme);
      setMessage("Theme updated globally. Reloading pages will use this style.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update theme.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
              <Paintbrush className="h-6 w-6 text-red-500" />
              Global Theme Control
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Change full-site color theme for all visitors. Layout stays unchanged, colors switch globally.
            </p>
          </div>
          <button
            onClick={() => void fetchTheme()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {UI_THEME_KEYS.map((themeKey) => {
          const isActive = selectedTheme === themeKey;
          const isLive = persistedTheme === themeKey;
          return (
            <button
              key={themeKey}
              onClick={() => {
                setSelectedTheme(themeKey);
                setMessage(null);
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                isActive
                  ? "border-red-500 bg-red-50/70 shadow-sm dark:border-red-400 dark:bg-red-500/10"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-[#1a1b23] dark:hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{UI_THEME_LABELS[themeKey]}</h3>
                  <p className="mt-1 text-sm text-gray-500">{THEME_DESCRIPTIONS[themeKey]}</p>
                </div>
                {isLive && <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-green-700">Live</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              Selected: <span className="text-red-500">{UI_THEME_LABELS[selectedTheme]}</span>
            </p>
            <p className="text-xs text-gray-500">
              Default baseline remains <strong>{UI_THEME_LABELS.classic}</strong>.
            </p>
          </div>
          <button
            onClick={() => void saveTheme()}
            disabled={saving || loading || !hasChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Theme"}
          </button>
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
