export const UI_THEME_KEYS = ["classic", "midnight", "ocean", "emerald"] as const;

export type UiThemeKey = (typeof UI_THEME_KEYS)[number];

export const DEFAULT_UI_THEME: UiThemeKey = "classic";

export const isUiThemeKey = (value: unknown): value is UiThemeKey =>
  typeof value === "string" && UI_THEME_KEYS.includes(value as UiThemeKey);

export const normalizeUiTheme = (value: unknown): UiThemeKey =>
  isUiThemeKey(value) ? value : DEFAULT_UI_THEME;

export const UI_THEME_LABELS: Record<UiThemeKey, string> = {
  classic: "Classic Crimson",
  midnight: "Midnight Pulse",
  ocean: "Ocean Care",
  emerald: "Emerald Hope",
};
