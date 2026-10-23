import { useId } from 'react';
import useDonorCountries from './useDonorCountries';
import { LocateFixed } from 'lucide-react';

export default function DonorCountryFilter({country,onChange,locked=false,onLocate,locating=false,locationMessage=''}:{country:string;onChange:(value:string)=>void;locked?:boolean;onLocate?:()=>void;locating?:boolean;locationMessage?:string}) {
  const id = useId();
  const {countries,loaded,failed}=useDonorCountries();
  return <div className="mb-5 text-left">
    <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">Find donors in your country</label>
    <select id={id} value={countries.includes(country)?country:''} disabled={locked||locating||!loaded} onChange={event=>onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100">
      <option value="" disabled>{!loaded?'Loading donor countries…':'Select a country with donors'}</option>
      {countries.map(name=><option key={name} value={name}>{name}</option>)}
    </select>
    {!locked&&onLocate&&<button type="button" onClick={onLocate} disabled={locating} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"><LocateFixed className={`h-4 w-4 ${locating?'animate-pulse':''}`}/>{locating?'Confirming location…':'Use precise location'}</button>}
    {locationMessage&&<p role="status" className="mt-2 text-xs leading-5 text-slate-600">{locationMessage}</p>}
    <p className="mt-2 text-xs leading-5 text-slate-500">{failed?'Country coverage could not be refreshed. Existing results remain available.':country ? `Prioritising ${country}. Local donors come first, followed by nearby cities and countries to fill the list. Blood group and organ filters stay selected. Distances are approximate.` : 'Detecting your country automatically. You can also choose a country with donor coverage here.'}</p>
  </div>;
}
