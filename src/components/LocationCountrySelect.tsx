import { LOCATION_COUNTRIES } from '@/src/lib/locationCountry';

export default function LocationCountrySelect({ value, onChange }: { value: string; onChange: (country: string) => void }) {
  return <label className="mt-2 block text-xs font-semibold text-slate-600">
    Country for location search
    <select value={value} onChange={event => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
      <option value="">Choose your country</option>
      {LOCATION_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
    </select>
  </label>;
}
