export const PROFILE_CODE_PATTERN = /^[A-Z0-9]{4}$/;
export const PROFILE_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const normalizeProfileCode = (code: string) => code.trim().toUpperCase();

// Calendar months, clamped at month-end (31 August -> 28/29 February).
export function nextProfileCodeChange(changedAt: Date | string | null): Date | null {
  if (!changedAt) return null;
  const date = new Date(changedAt);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}
