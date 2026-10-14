"use client";

import { Search, X } from 'lucide-react';

const groups = ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'];

export default function DonorBloodFilters({ activeGroup, onGroupChange, searchQuery, onSearchChange, placeholder, analyticsPrefix }: {
  activeGroup: string | null; onGroupChange: (group: string | null) => void;
  searchQuery: string; onSearchChange: (query: string) => void; placeholder: string; analyticsPrefix: string;
}) {
  return <div className="donor-blood-filters w-full min-w-0 text-left">
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-700">Blood group</p>
      <button type="button" onClick={() => onGroupChange(null)} aria-pressed={activeGroup === null} data-analytics-component={`${analyticsPrefix} Filter All`} className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${activeGroup === null ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-700'}`}>All groups</button>
    </div>
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" aria-label="Filter by blood group">
      {groups.map(group => <button key={group} type="button" aria-pressed={activeGroup === group} onClick={() => onGroupChange(group)} data-analytics-component={`${analyticsPrefix} Filter ${group}`} className={`flex min-h-12 min-w-0 items-center justify-center rounded-xl border text-base font-bold transition-colors ${activeGroup === group ? 'border-rose-700 bg-rose-700 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50'}`}>{group}</button>)}
    </div>
    <label className="relative mt-3 block w-full">
      <span className="sr-only">Search donors by city or name</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      <input type="search" aria-label="Search donors by city or name" value={searchQuery} onChange={event => onSearchChange(event.target.value)} placeholder={placeholder} className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-rose-700 focus:ring-2 focus:ring-rose-700/10" />
      {searchQuery && <button type="button" aria-label="Clear donor search" onClick={() => onSearchChange('')} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
    </label>
  </div>;
}
