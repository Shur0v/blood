const sanitizeDomain = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "").split("/")[0];
  const host = withoutProtocol.replace(/^\./, "").toLowerCase();
  if (!host || host === "localhost") return undefined;
  return host;
};

export const resolveSessionCookieDomain = (): string | undefined => {
  if (process.env.NODE_ENV !== "production") return undefined;

  // Prefer explicit cookie domain to avoid accidental mismatch with NEXT_PUBLIC_BASE_URL host.
  const explicit = sanitizeDomain(process.env.SESSION_COOKIE_DOMAIN || "");
  if (explicit) return explicit.startsWith(".") ? explicit : `.${explicit}`;

  return undefined;
};

