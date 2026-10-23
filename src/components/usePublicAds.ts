'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { createAdsRuntimeStore, type AdsRuntime } from '@/src/lib/adsRuntimeStore';

const UPDATE_KEY = 'bloodnet.ads-runtime-update';
const store = createAdsRuntimeStore(async () => {
  const response = await fetch('/api/public/ads-settings', { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok || !body?.success || typeof body.data?.adsRuntimeEnabled !== 'boolean' || !Array.isArray(body.data.adUnits)) throw new Error('Ad settings unavailable');
  return body.data as AdsRuntime;
}, () => document.visibilityState === 'visible');
const empty = () => null;
let listening = false;
function listenForAdminChanges() {
  if (listening) return;
  listening = true;
  window.addEventListener('storage', event => {
    if (event.key !== UPDATE_KEY || !event.newValue) return;
    try { const value = JSON.parse(event.newValue); if (typeof value.adsRuntimeEnabled === 'boolean' && Array.isArray(value.adUnits)) store.update(value); } catch { /* Ignore unrelated/malformed storage. */ }
  });
}
export function publishAdsRuntime(value: AdsRuntime) {
  store.update(value);
  try { localStorage.setItem(UPDATE_KEY, JSON.stringify(value)); } catch { /* Same-tab updates still work. */ }
}
export default function usePublicAds() {
  const path = usePathname();
  const blocked = ['/private', '/admin', '/admin-dashboard', '/dashboard', '/api'].some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  const subscribe = useCallback((listener: () => void) => {
    if (blocked || window.self !== window.top && new URLSearchParams(window.location.search).get('heatmapPreview') === '1') return () => {};
    listenForAdminChanges();
    return store.subscribe(listener);
  }, [blocked]);
  return useSyncExternalStore(subscribe, blocked ? empty : store.getSnapshot, empty);
}
