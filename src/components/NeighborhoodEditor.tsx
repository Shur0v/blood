import useLocationSuggestions from './useLocationSuggestions';
import LocationSearchFeedback from './LocationSearchFeedback';
import { locationLabel, locationContextLabel } from '@/src/lib/locationSettings';
import { useEffect, useId, useState } from 'react';

type Suggestion = {
  token: string; city: string; country: string; state?: string; district?: string;
  registrationArea: { name: string; placeId: string };
};
type Location = { city: string; country: string; neighborhood: string | null; enabled: boolean };
const label = (item: Suggestion) => `${item.registrationArea.name}, ${item.city}, ${item.country}`;

export default function NeighborhoodEditor({ revision, userId, onSaved, onAvailability }: {
  revision: string; userId: string; onSaved?: () => void | Promise<void>; onAvailability?: (enabled: boolean) => void;
}) {
  const [location, setLocation] = useState<Location | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const [selected, setSelected] = useState<Suggestion | null>(null);
  const lookup = useLocationSuggestions(text, editing && !selected, '/api/users/me/neighborhood', userId);
  const suggestions = lookup.suggestions.filter((item): item is typeof item & { registrationArea: { name: string; placeId: string } } => Boolean(item.registrationArea));
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState('');
  const loading = lookup.loading;
  const [saving, setSaving] = useState(false);
  const listId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setLocation(null);
    setEditing(false);
    void fetch('/api/users/me/neighborhood', { cache: 'no-store', signal: controller.signal, headers: { 'x-bloodnet-profile': userId } })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || 'Unable to load neighborhood.');
        if (!controller.signal.aborted) {
          setLocation(body.data);
          onAvailability?.(body.data.enabled === true);
        }
      }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, [revision, userId, onAvailability, lookup.settings.revision]);

  useEffect(() => { setActive(-1); }, [text]);

  useEffect(() => { onAvailability?.(lookup.settings.detail === 'detailed'); }, [lookup.settings.detail, onAvailability]);

  const choose = (item: Suggestion) => {
    setSelected(item);
    setText(label(item));
    lookup.clear();
    setMessage('');
  };
  const save = async (clear = false) => {
    if (saving || (!clear && !selected)) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/users/me/neighborhood', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-bloodnet-profile': userId },
        body: JSON.stringify(clear ? { clear: true } : { token: selected!.token }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Unable to save. Please retry.');
      setLocation(current => current ? { ...current, ...body.data } : current);
      setEditing(false);
      setMessage(clear ? 'Neighborhood cleared.' : 'Neighborhood saved.');
      await onSaved?.();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save.'); }
    finally { setSaving(false); }
  };

  if (!location?.enabled || lookup.settings.detail === 'cities') return message ? <p role="status" className="mb-3 text-xs text-amber-700">{message}</p> : null;
  return <section data-analytics-private="" className="mb-4 rounded-xl border border-border/10 bg-white p-3" aria-label="Primary neighborhood">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs font-semibold text-slate-600">Primary location</p>
        <p className="text-sm text-slate-800">{[location.neighborhood, location.city, location.country].filter(Boolean).join(', ')}</p>
      </div>
      {!editing && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-primary focus-visible:ring-2 focus-visible:ring-primary" onClick={() => {
        setEditing(true); setSelected(null); setText(''); setMessage('');
      }}>Edit neighborhood</button>}
    </div>
    {editing && <div className="mt-3">
      <label htmlFor={listId + '-input'} className="text-xs text-slate-600">Choose an area in {location.city}, {location.country}</label>
      <input id={listId + '-input'} role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0}
        aria-controls={listId} aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={text} maxLength={120} disabled={saving} placeholder="Search your neighborhood…"
        className="mt-1 w-full rounded-xl border border-border/20 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
        onChange={event => { setText(event.target.value); setSelected(null); }}
        onKeyDown={event => {
          if (event.key === 'Escape') { lookup.clear(); setActive(-1); }
          if (suggestions.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            setActive(index => event.key === 'ArrowDown' ? (index + 1) % suggestions.length : (index <= 0 ? suggestions.length : index) - 1);
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (active >= 0 && suggestions[active]) choose(suggestions[active]);
          }
        }} />
      <ul id={listId} role="listbox" aria-label="Neighborhood suggestions" className="mt-1 max-h-52 overflow-auto">
        {suggestions.map((item, index) => <li key={item.registrationArea.placeId} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
          <button type="button" disabled={saving} onClick={() => choose(item)} className={`w-full rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary ${index === active ? 'bg-primary/10' : ''}`}>
            {locationLabel(item, lookup.settings.countryInLabel)}<span className="block text-xs text-slate-500">{locationContextLabel(item)}{item.corrected ? ' · Suggested spelling' : ''}</span>
          </button>
        </li>)}
      </ul>
      <LocationSearchFeedback lookup={lookup} />
      {loading && <p role="status" className="text-xs text-slate-600">Searching…</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={!selected || saving} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" disabled={saving} onClick={() => { setEditing(false); setSelected(null); setMessage(''); }} className="rounded-lg border border-border/20 px-4 py-2 text-xs text-slate-700">Cancel</button>
        {location.neighborhood && <button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-lg px-4 py-2 text-xs text-primary">Clear neighborhood</button>}
      </div>
    </div>}
    {message && <p role="status" className="mt-2 text-xs text-amber-700">{message}</p>}
  </section>;
}
