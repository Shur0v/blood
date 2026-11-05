import { useEffect, useState } from 'react';
import useViewerGeo from './useViewerGeo';

export type LocationSuggestion = {
  city: string; country: string; state?: string; district?: string; formatted_location: string;
  latitude: number; longitude: number; provider_place_id: string; token: string;
  registrationArea?: { name: string; placeId: string };
};

export default function useLocationSuggestions(text: string, enabled = true, endpoint = '/api/location/signup') {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [requiresCountry, setRequiresCountry] = useState(false);
  const [countryChoice, setCountryChoice] = useState('');
  const geo = useViewerGeo();

  useEffect(() => {
    setSuggestions([]);
    setMessage('');
    setLoading(false);
    if (!enabled || text.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const timeout = setTimeout(() => controller.abort(), 18000);
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
        const response = await fetch(`${endpoint}?${params}`, { cache: 'no-store', signal: controller.signal });
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !body.success) throw new Error(body.message || 'Unable to search locations. Please retry.');
        setSuggestions(body.data || []);
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
  }, [text, enabled, endpoint, countryChoice, geo.source, geo.country, geo.lat, geo.lng]);

  return { suggestions, loading, message, requiresCountry, countryChoice, setCountryChoice, clear: () => setSuggestions([]) };
}
