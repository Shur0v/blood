import Link from 'next/link';
import {getDonorLocations,donorLocationPath} from '../backend/services/donorLocations';
import {bloodGroupToSlug} from '../lib/seoRouting';
export default async function RegionalSeoFooter({country}:{country:string}){
 let rows;try{rows=(await getDonorLocations()).filter(row=>row.country.toLowerCase()===country.toLowerCase()&&row.bloodCount>0);}catch{return null;}
 if(!rows.length)return null;
 const city=rows.find(row=>row.city==='Delhi'||row.city==='Lahore')||rows[0];
 const others=rows.filter(row=>row.city!==city.city).slice(0,9);
 return <section className="mx-auto mt-8 mb-10 max-w-7xl px-4"><div className="rounded-[8px] border border-border/20 bg-white/90 p-6 shadow-card"><div className="grid gap-8 md:grid-cols-2"><div><h2 className="text-xl font-semibold text-gray-900">Donor cities in {country}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{others.map(row=><Link key={row.city} href={donorLocationPath(row,'blood')} className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm">Blood donors in {row.city}</Link>)}</div></div><div><h2 className="text-xl font-semibold text-gray-900">Recorded blood groups in {city.city}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{city.bloodGroups.filter(group=>bloodGroupToSlug(group)).map(group=><Link key={group} href={donorLocationPath(city,'blood')+'/'+bloodGroupToSlug(group)} className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm">{group} in {city.city}</Link>)}</div></div></div></div></section>;
}
