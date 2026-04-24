import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'bn', 'ja', 'es', 'de'] as const;
const DEFAULT_LOCALE = 'en';
const LOCALE_COOKIE = 'bloodnet_locale';

const isStaticAsset = (pathname: string) =>
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon') ||
  pathname.startsWith('/images') ||
  pathname.startsWith('/uploads') ||
  pathname.startsWith('/public');

const pickLocaleFromHeader = (header: string | null): string => {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(',')
    .map((part) => part.trim().split(';')[0].toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.split('-')[0];
    if ((SUPPORTED_LOCALES as readonly string[]).includes(candidate)) return candidate;
    if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base;
  }
  return DEFAULT_LOCALE;
};

const applySecurityHeaders = (response: NextResponse, isApiRoute: boolean) => {
  const isProd = process.env.NODE_ENV === 'production';
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    `script-src 'self' ${isProd ? '' : "'unsafe-eval'"} 'unsafe-inline' https:`,
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ]
    .join('; ')
    .replace(/\s+/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  if (isProd) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  if (isApiRoute) {
    if (response.headers.get('Cache-Control')) return;
    if (response.headers.get('X-Accel-Buffering')) return;
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) return;
    if (response.headers.get('Content-Disposition')) return;
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (!isStaticAsset(pathname)) {
    const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale =
      existingLocale && (SUPPORTED_LOCALES as readonly string[]).includes(existingLocale)
        ? existingLocale
        : pickLocaleFromHeader(request.headers.get('accept-language'));

    if (!existingLocale || existingLocale !== locale) {
      response.cookies.set(LOCALE_COOKIE, locale, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    response.headers.set('X-BloodNet-Locale', locale);
  }

  const isApiRoute = pathname.startsWith('/api/');
  if (
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/users/me/')
  ) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  applySecurityHeaders(response, isApiRoute);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
