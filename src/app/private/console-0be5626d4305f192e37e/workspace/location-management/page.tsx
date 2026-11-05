'use client';
import { useEffect, useState } from 'react';
import {
  DEFAULT_LOCATION_SETTINGS,
  LocationSettingsSchema,
  type LocationSettings,
  locationLabel,
  locationContextLabel,
  LOCATION_SETTINGS_EVENT,
} from '@/src/lib/locationSettings';
import useLocationSuggestions from '@/src/components/useLocationSuggestions';
import LocationSearchFeedback from '@/src/components/LocationSearchFeedback';
import LocationCountrySelect from '@/src/components/LocationCountrySelect';

export default function LocationManagementPage() {
  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_LOCATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const lookup = useLocationSuggestions(query);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/location-settings', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body.success)
        throw new Error(body.message || 'Unable to load location settings.');
      setSettings(body.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load settings.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const { revision, ...values } = settings;
      const response = await fetch('/api/admin/location-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: LocationSettingsSchema.parse(values), revision }),
      });
      const body = await response.json();
      if (!response.ok || !body.success)
        throw new Error(body.message || 'Unable to save settings.');
      setSettings(body.data);
      window.dispatchEvent(new Event(LOCATION_SETTINGS_EVENT));
      setMessage('Location settings saved. The preview now uses these saved settings.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <section className="admin-card space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-xl font-semibold">Location Management</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Control signup and account location selection. Countrywide search includes matching
            places in other districts. Nearby priority changes their order.
          </p>
        </div>
        <fieldset disabled={loading || saving} className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            Selection detail
            <select
              aria-label="Selection detail"
              className="admin-input block w-full rounded-lg border bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={settings.detail}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  detail: event.target.value as LocationSettings['detail'],
                }))
              }
            >
              <option value="detailed">Cities and local areas</option>
              <option value="cities">Cities only</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            Geographic scope
            <select
              aria-label="Geographic scope"
              className="admin-input block w-full rounded-lg border bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={settings.scope}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  scope: event.target.value as LocationSettings['scope'],
                }))
              }
            >
              <option value="country">Countrywide</option>
              <option value="district">Current detected district only</option>
            </select>
          </label>
          {(
            [
              ['nearbyFirst', 'Prioritize nearby matches'],
              ['typoSuggestions', 'Suggest spelling corrections'],
              ['countryInLabel', 'Show country in main label'],
            ] as const
          ).map(([key, title]) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              {title}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void save()}
            className="admin-action bg-rose-700 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() =>
              setSettings((current) => ({
                ...DEFAULT_LOCATION_SETTINGS,
                revision: current.revision,
              }))
            }
            className="admin-action"
          >
            Restore defaults
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void load()}
            className="admin-action"
          >
            Reload saved settings
          </button>
        </div>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Restore defaults updates this form. Save to apply. Existing saved locations remain
          available. District-only selection requires a confirmed current district when detection is
          unavailable.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-semibold">Test saved search settings</h3>
        <label className="mt-3 block text-sm" htmlFor="location-preview">
          Search a city or local area
        </label>
        <input
          id="location-preview"
          value={query}
          maxLength={120}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Dhanmondi or Gabtoli"
          className="mt-2 w-full rounded-lg border bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        {lookup.requiresCountry && (
          <LocationCountrySelect value={lookup.countryChoice} onChange={lookup.setCountryChoice} />
        )}
        <ul aria-label="Preview location suggestions" className="my-2 max-h-80 overflow-y-auto">
          {lookup.suggestions.map((item) => (
            <li
              key={item.selectionId || item.registrationArea?.placeId || item.provider_place_id}
              className="border-b border-slate-100 p-3"
            >
              <p>{locationLabel(item, lookup.settings.countryInLabel)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {locationContextLabel(item)}
                {item.corrected ? ' · Suggested spelling' : ''}
              </p>
            </li>
          ))}
        </ul>
        <LocationSearchFeedback lookup={lookup} />
      </section>
    </div>
  );
}
