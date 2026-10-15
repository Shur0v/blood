import Link from 'next/link';
import { donorLocationPath, getDonorLocations } from '@/src/backend/services/donorLocations';

export default async function DonorLocationDirectory({limit}:{limit?:number}) {
  let rows;
  try { rows = await getDonorLocations(); } catch { return <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-600">The donor location directory is temporarily unavailable. <Link href="/cities" className="underline">Try again</Link>.</p>; }
  const locations = limit ? [...rows].sort((a,b)=>b.updatedAt.getTime()-a.updatedAt.getTime()).slice(0,limit) : rows;
  if (!locations.length) return null;
  return <section aria-labelledby="active-donor-locations" className="mx-auto max-w-7xl px-4 py-12"><h2 id="active-donor-locations" className="text-2xl font-semibold tracking-tight text-slate-900">Find blood and organ donors by location</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Explore cities with active donor entries. Each location page shows its current blood groups or organ pledges and helps you reach relevant volunteers.</p><ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{locations.map(row=><li key={`${row.country}:${row.city}`} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">{row.city}, {row.country}</h3><div className="mt-3 space-y-2 text-sm text-rose-700">{row.bloodCount>0&&<Link className="block underline underline-offset-4" href={donorLocationPath(row,'blood')}>{row.bloodCount.toLocaleString()} blood donor {row.bloodCount===1?'entry':'entries'}</Link>}{row.organCount>0&&<Link className="block underline underline-offset-4" href={donorLocationPath(row,'organ')}>{row.organCount.toLocaleString()} organ donor {row.organCount===1?'entry':'entries'}</Link>}</div></li>)}</ul>{limit&&rows.length>limit&&<Link href="/cities" className="mt-6 inline-block font-semibold text-rose-700 underline">Browse all donor locations</Link>}</section>;
}
