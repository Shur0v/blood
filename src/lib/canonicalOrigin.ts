/** Redirect only the configured site's www alias. Never redirect localhost or an arbitrary Host. */
export function canonicalAliasUrl(requestUrl: string, host: string | null, publicOrigin?: string): URL | null {
  if (!publicOrigin || !host) return null;
  try {
    const canonical = new URL(publicOrigin);
    if (canonical.protocol !== 'https:' || canonical.port || canonical.hostname.startsWith('www.') || !canonical.hostname.includes('.') || canonical.hostname === 'localhost') return null;
    if (host.toLowerCase() !== `www.${canonical.hostname}`) return null;
    const target = new URL(requestUrl);
    target.protocol = canonical.protocol;
    target.host = canonical.host;
    return target;
  } catch { return null; }
}
