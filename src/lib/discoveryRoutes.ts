// Only these public directory routes can be embedded in the discovery panel.
export function isDiscoveryPath(pathname: string) {
  return /^\/(cities|countries|common-blood-searches|common-organ-searches|guides|network|donors)$/.test(pathname)
    || /^\/(blood-donors|organ-donors|blood|organ|city|keywords|country-keyword-hubs|guides|network|donors)\/[a-z0-9+%-]+(?:\/[a-z0-9+%-]+){0,2}$/i.test(pathname);
}
