import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import useViewerGeo from './useViewerGeo';
import { DEFAULT_LOCATION_SETTINGS, LOCATION_SETTINGS_EVENT, type LocationSettings } from '@/src/lib/locationSettings';

export type LocationSuggestion = {
  city: string; country: string; state?: string; district?: string; formatted_location: string;
  latitude: number; longitude: number; provider_place_id: string; token: string;
  registrationArea?: { name: string; placeId: string };
  selectionId?: string; corrected?: boolean; placeType?: string;
};

export default function useLocationSuggestions(text: string, enabled = true, endpoint = '/api/location/signup', profileId?: string) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [requiresCountry, setRequiresCountry] = useState(false);
  const [countryChoice, setCountryChoice] = useState('');
  const geo = useViewerGeo();
  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_LOCATION_SETTINGS);
  const [requiresLocation, setRequiresLocation] = useState(false);
  const [detectedDistrict, setDetectedDistrict] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [refresh, setRefresh] = useState(0);
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, listId]);
  useEffect(() => {
    let live = true;
    const reload = async () => {
      try {
        const response = await fetch('/api/public/location-settings', { cache: 'no-store' });
        const body = await response.json();
        if (live && response.ok && Number.isInteger(body.data?.revision)) setSettings(body.data);
      } catch { /* Search responses also carry the effective settings. */ }
      if (live) setRefresh(value => value + 1);
    };
    void reload();
    window.addEventListener('focus', reload);
    window.addEventListener(LOCATION_SETTINGS_EVENT, reload);
    return () => { live = false; window.removeEventListener('focus', reload); window.removeEventListener(LOCATION_SETTINGS_EVENT, reload); };
  }, []);

  useEffect(() => {
    setSuggestions([]);
    setActiveIndex(-1);
    setVisibleCount(20);
    setRequiresCountry(false);
    setRequiresLocation(false);
    setDetectedDistrict('');
    setMessage('');
    setLoading(false);
    if (!enabled || text.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 60000);
      setLoading(true);
      try {
        const params = new URLSearchParams({ text: text.trim() });
        if (countryChoice) params.set('country', countryChoice);
        // Only reuse an already confirmed GPS fix. No permission prompt is opened here.
        if (geo.source === 'gps' && geo.country && geo.lat !== undefined && geo.lng !== undefined) {
          params.set('browserCountry', geo.country);
          params.set('browserLat', String(geo.lat));
          params.set('browserLng', String(geo.lng));
        }
        const response = await fetch(`${endpoint}?${params}`, { cache: 'no-store', signal: controller.signal, headers: profileId ? { 'x-bloodnet-profile': profileId } : undefined });
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !body.success) throw new Error(body.message || 'Unable to search locations. Please retry.');
        setSuggestions(Array.isArray(body.data) ? body.data : body.data?.suggestions || []);
        setRequiresLocation(body.meta?.requiresLocation === true);
        setDetectedDistrict(body.meta?.district?.name || '');
        if (Number.isInteger(body.meta?.settings?.revision)) setSettings(body.meta.settings);
        setRequiresCountry(body.meta?.requiresCountry === true);
        setMessage(body.meta?.message || '');
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Location search unavailable.');
        else if (controller.signal.reason !== 'changed') setMessage('Location lookup timed out. Please retry.');
      } finally {
        clearTimeout(timeout);
        if (controller.signal.reason !== 'changed') setLoading(false);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort('changed'); };
  }, [text, enabled, endpoint, countryChoice, geo.source, geo.country, geo.lat, geo.lng, refresh, profileId]);

  const visible = suggestions.slice(0, visibleCount);
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, select: (item: LocationSuggestion) => void) => {
    if (event.key === 'Escape') { setSuggestions([]); setActiveIndex(-1); }
    if (visible.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      setActiveIndex(index => event.key === 'ArrowDown' ? (index + 1) % visible.length : (index <= 0 ? visible.length : index) - 1);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && visible[activeIndex]) select(visible[activeIndex]);
    }
  };
  return { suggestions: visible, total: suggestions.length, hasMore: visibleCount < suggestions.length,
    listId, activeIndex, handleKeyDown,
    showMore: () => setVisibleCount(value => value + 20), loading, message, requiresCountry, requiresLocation,
    settings, detectedDistrict, countryChoice, setCountryChoice, confirmLocation: geo.requestPreciseLocation, locating: geo.locating,
    locationMessage: geo.locationMessage, clear: () => setSuggestions([]) };
}
