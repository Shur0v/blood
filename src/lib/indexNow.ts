export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY || '';
  return /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : null;
}

/** Only canonical public pages can be sent. Never forward account data or preview queries. */
export function indexNowUrls(base: string, values: string[]): string[] {
  const origin = new URL(base).origin;
  const urls = values.map(value => {
    const url = new URL(value, origin);
    const decodedPath = decodeURIComponent(url.pathname);
    if (url.origin !== origin || url.search || url.hash || url.username || url.password ||
      /^\/(api|admin[^/]*|dashboard|account|profile|private|user|settings|login|register|checkout|payment|backup|trash|success|failed)(\/|$)/i.test(decodedPath)) {
      throw new Error('IndexNow accepts only canonical public page URLs without query parameters.');
    }
    return url.href;
  });
  if (!urls.length || urls.length > 10000) throw new Error('Provide between 1 and 10,000 changed public URLs.');
  return [...new Set(urls)];
}
