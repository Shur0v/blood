'use client';
import type useLocationSuggestions from './useLocationSuggestions';

type Props = { lookup: ReturnType<typeof useLocationSuggestions> };
export function LocationMoreMatches({ lookup }: Props) {
  return lookup.hasMore ? (
    <button
      type="button"
      onClick={lookup.showMore}
      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-slate-600 dark:text-rose-300"
    >
      Show more matches ({lookup.total - lookup.suggestions.length} remaining)
    </button>
  ) : null;
}

export default function LocationSearchFeedback({
  lookup,
  showMore = true,
}: Props & { showMore?: boolean }) {
  return (
    <div aria-live="polite" className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
      {lookup.loading && <p>Searching locations…</p>}
      {lookup.message && <p>{lookup.message}</p>}
      {lookup.detectedDistrict && <p>Current district filter · {lookup.detectedDistrict}</p>}
      {(lookup.requiresLocation || lookup.settings.scope === 'district') && (
        <button
          type="button"
          disabled={lookup.locating}
          onClick={() => void lookup.confirmLocation()}
          className="rounded-lg border border-rose-200 px-3 py-2 font-semibold text-rose-700 dark:text-rose-300 disabled:opacity-50"
        >
          {lookup.locating ? 'Confirming location…' : 'Confirm my current location'}
        </button>
      )}
      {lookup.settings.scope === 'district' && lookup.locationMessage && (
        <p>{lookup.locationMessage}</p>
      )}
      {showMore && <LocationMoreMatches lookup={lookup} />}
    </div>
  );
}
