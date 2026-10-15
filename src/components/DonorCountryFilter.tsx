import { useId } from 'react';
import { DONOR_COUNTRIES } from './useDonorRegion';

export default function DonorCountryFilter({country,onChange,locked=false}:{country:string;onChange:(value:string)=>void;locked?:boolean}) {
  const id = useId();
  return <div className="mb-5 text-left">
    <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">Find donors in your country</label>
    <select id={id} value={country} disabled={locked} onChange={event=>onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100">
      <option value="" disabled>Select your country</option>
      {country&&!DONOR_COUNTRIES.includes(country)&&<option value={country}>{country}</option>}
      {DONOR_COUNTRIES.map(name=><option key={name} value={name}>{name}</option>)}
    </select>
    <p className="mt-2 text-xs leading-5 text-slate-500">{country ? `Showing donors serving ${country}. Search a city below to narrow your results.` : 'Choose your country to see local donors. Location detection may suggest a country.'}</p>
  </div>;
}
