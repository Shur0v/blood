'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {HOME_COPY_FIELDS,HOME_OPTIONAL_SECTIONS,normalizeHomepageConfig,type HomepageConfig} from '@/src/lib/homepageContent';

export default function HomepageContentEditor(){
 const [value,setValue]=useState<HomepageConfig>(()=>normalizeHomepageConfig({}));
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const pathname=usePathname();
 const field='mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 dark:border-gray-700 dark:bg-[#0f1115] dark:text-slate-100';
 async function load(){
  if(loaded||busy)return;setBusy(true);
  try{const response=await fetch('/api/admin/homepage-content',{credentials:'include',cache:'no-store'}),body=await response.json();if(!response.ok||!body.success)throw Error(body.message||'Could not load homepage settings.');setValue(normalizeHomepageConfig(body.data?.draft||{}));setLoaded(true);}
  catch(error){setMessage(error instanceof Error?error.message:'Loading failed.');}finally{setBusy(false);}
 }
 async function save(action:'draft'|'publish'|'restore'){
  setBusy(true);setMessage('');
  try{const response=await fetch('/api/admin/homepage-content',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,config:value})}),body=await response.json();if(!response.ok||!body.success)throw Error(body.message||'Could not save homepage settings.');setValue(normalizeHomepageConfig(body.data.draft));setMessage(action==='draft'?'Draft saved. The public homepage has not changed.':action==='restore'?'Original homepage restored.':'Homepage published. New homepage visits show your changes.');}
  catch(error){setMessage(error instanceof Error?error.message:'Saving failed.');}finally{setBusy(false);}
 }
 return <details className="rounded-2xl border border-gray-200 bg-white p-6 text-slate-900 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23] dark:text-slate-100" onToggle={event=>{if(event.currentTarget.open)void load();}}>
  <summary className="cursor-pointer text-lg font-semibold">Homepage editor</summary>
  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Edit the main homepage separately from regional pages. Blank text keeps the original styled content. Donor search, statistics, navigation and account access keep their live behavior.</p>
  {loaded&&<fieldset disabled={busy} className="mt-6 space-y-6 disabled:opacity-60">
   <div className="flex flex-wrap gap-4 text-sm underline"><a href="/" target="_blank" rel="noopener noreferrer">Open published homepage ↗</a><Link href={`${pathname}/slider-manager`}>Edit homepage slider images</Link><Link href={`${pathname}/faq`}>Edit FAQ questions and answers</Link><Link href={`${pathname}/theme-control`}>Existing website theme controls</Link></div>
   <p className="text-sm text-slate-500 dark:text-slate-400">Image, FAQ and theme managers publish through their existing controls independently of this draft. This editor changes homepage text and section visibility only.</p>
   <details className="rounded-xl border border-slate-200 p-4 dark:border-gray-700" open><summary className="cursor-pointer font-semibold">Headings, descriptions and buttons</summary><div className="mt-4 grid gap-5 md:grid-cols-2">{HOME_COPY_FIELDS.map(([key,label,max])=><label className="block text-sm" key={key}>{label}<textarea rows={max>300?3:2} maxLength={max} className={field} placeholder="Keep original content" value={value.copy[key]||''} onChange={event=>setValue({...value,copy:{...value.copy,[key]:event.target.value}})}/></label>)}</div></details>
   <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-gray-700"><legend className="px-2 font-semibold">Visible homepage sections</legend><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{HOME_OPTIONAL_SECTIONS.map(([key,label])=><label className="flex items-center gap-3 text-sm" key={key}><input type="checkbox" checked={!value.hiddenSections.includes(key)} onChange={event=>setValue({...value,hiddenSections:event.target.checked?value.hiddenSections.filter(section=>section!==key):[...value.hiddenSections,key]})}/>{label}</label>)}</div></fieldset>
   <div className="flex flex-wrap gap-3"><button type="button" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold" onClick={()=>void save('draft')}>Save draft</button><button type="button" className="rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white" onClick={()=>void save('publish')}>Publish homepage</button><button type="button" className="rounded-full border border-slate-300 px-5 py-3 text-sm" onClick={()=>setValue(normalizeHomepageConfig({}))}>Reset draft to original</button></div>
   <details><summary className="cursor-pointer text-sm underline">Restore original public homepage</summary><p className="my-3 text-sm">This publishes the original text and shows all homepage sections. Existing slider images, FAQs and theme settings stay managed by their own tools.</p><button type="button" className="rounded-full border border-rose-300 px-5 py-3 text-sm" onClick={()=>void save('restore')}>Publish original homepage</button></details>
  </fieldset>}
  {!loaded&&message&&<button type="button" disabled={busy} onClick={()=>void load()}>Retry loading</button>}{message&&<p role="status" className="mt-4 text-sm">{message}</p>}
 </details>;
}
