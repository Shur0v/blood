import type { ManagedAdUnit } from './adRuntime';

export type PublicAdUnit = Pick<ManagedAdUnit, 'id' | 'adType' | 'scope' | 'placement'> & {
  scriptSrc?: string | null; targetUrl?: string | null; linkLabel?: string | null;
  containerId?: string | null; slotKey?: 'native-ad-1' | 'native-ad-2' | 'native-ad-3' | null;
  bannerKey?: string | null; bannerWidth?: number | null; bannerHeight?: number | null;
};
export type AdsRuntime = { adsRuntimeEnabled: boolean; adUnits: PublicAdUnit[]; updatedAt?: string | null };
export const ADS_REFRESH_MS = 30_000;

// Shared by every placement. Off/failed settings never schedule another request.
export function createAdsRuntimeStore(fetchSettings: () => Promise<AdsRuntime>, visible = () => true) {
  let snapshot: AdsRuntime | null = null, started = false;
  let pending: Promise<void> | null = null, timer: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;
  const listeners = new Set<() => void>();
  const stop = () => { clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    stop();
    if (snapshot?.adsRuntimeEnabled && listeners.size) timer = setTimeout(() => {
      if (visible()) void refresh(); else schedule();
    }, ADS_REFRESH_MS);
  };
  const update = (value: AdsRuntime) => {
    started = true; revision++;
    const next = { ...value, adUnits: value.adsRuntimeEnabled ? value.adUnits : [] };
    if (JSON.stringify([snapshot?.adsRuntimeEnabled, snapshot?.adUnits]) !== JSON.stringify([next.adsRuntimeEnabled, next.adUnits])) {
      snapshot = next; listeners.forEach(listener => listener());
    }
    schedule();
  };
  const refresh = (): Promise<void> => {
    if (pending) return pending;
    const requestRevision = revision;
    pending = (async () => {
      try { const next = await fetchSettings(); if (revision === requestRevision) update(next); }
      catch { if (revision === requestRevision) update({ adsRuntimeEnabled: false, adUnits: [] }); }
      finally { pending = null; schedule(); }
    })();
    return pending;
  };
  return {
    getSnapshot: () => snapshot,
    update,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!started) { started = true; void refresh(); } else schedule();
      return () => { listeners.delete(listener); if (!listeners.size) stop(); };
    },
  };
}
