import { cookies, headers } from 'next/headers';

export const SUPPORTED_LOCALES = ['en', 'bn', 'ja', 'es', 'de'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_COOKIE_KEY = 'bloodnet_locale';

const normalizeLocale = (input: string | null | undefined): SupportedLocale | null => {
  if (!input) return null;
  const lowered = input.toLowerCase();
  const base = lowered.split('-')[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(lowered)) return lowered as SupportedLocale;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as SupportedLocale;
  return null;
};

export const getRequestLocale = async (): Promise<SupportedLocale> => {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  if (cookieLocale) return cookieLocale;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  if (acceptLanguage) {
    const candidates = acceptLanguage
      .split(',')
      .map((part) => part.trim().split(';')[0]);
    for (const candidate of candidates) {
      const locale = normalizeLocale(candidate);
      if (locale) return locale;
    }
  }

  return DEFAULT_LOCALE;
};

export const isSupportedLocale = (value: string | null | undefined): value is SupportedLocale => {
  return Boolean(value && normalizeLocale(value));
};

export const resolveLocaleFromRequest = (req: Request): SupportedLocale => {
  const url = new URL(req.url);
  const queryLocale = normalizeLocale(url.searchParams.get('locale'));
  if (queryLocale) return queryLocale;

  const cookieHeader = req.headers.get('cookie') || '';
  const cookieMatch = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${LOCALE_COOKIE_KEY}=`));
  if (cookieMatch) {
    const cookieLocale = normalizeLocale(cookieMatch.split('=').slice(1).join('='));
    if (cookieLocale) return cookieLocale;
  }

  const acceptLanguage = req.headers.get('accept-language');
  if (acceptLanguage) {
    const candidates = acceptLanguage
      .split(',')
      .map((part) => part.trim().split(';')[0]);
    for (const candidate of candidates) {
      const parsed = normalizeLocale(candidate);
      if (parsed) return parsed;
    }
  }

  return DEFAULT_LOCALE;
};
