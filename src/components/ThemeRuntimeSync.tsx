"use client";

import { useEffect } from "react";
import { DEFAULT_UI_THEME, normalizeUiTheme, type UiThemeKey } from "@/src/lib/uiTheme";

const THEME_STORAGE_KEY = "bloodnet_ui_theme";

const applyTheme = (theme: UiThemeKey) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export default function ThemeRuntimeSync() {
  useEffect(() => {
    let cancelled = false;

    const syncFromServer = async () => {
      try {
        const res = await fetch("/api/public/theme", { cache: "no-store" });
        const payload = await res.json();
        if (cancelled || !res.ok || !payload?.success) return;
        const theme = normalizeUiTheme(payload?.data?.uiTheme);
        applyTheme(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Keep current theme silently on network/API failure.
      }
    };

    const storedTheme = normalizeUiTheme(localStorage.getItem(THEME_STORAGE_KEY));
    applyTheme(storedTheme || DEFAULT_UI_THEME);
    void syncFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
