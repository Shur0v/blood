'use client';

import { useEffect, useRef, useState } from 'react';
import { ClipboardList, Download, FilePlus2, FileText, LockKeyhole, RefreshCw, Search, Stethoscope, ZoomIn } from 'lucide-react';
import { REPORT_CATEGORIES, medicalRecordDate, type MedicalDocument, type MedicalTimelineItem } from '@/src/lib/medicalRecords';
import MedicalRecordUploader, { MedicalImagePreview, medicalBytes, medicalFieldClass } from './MedicalRecordUploader';

type Mode='reports'|'prescriptions';
function recordRequest(mode:Mode, filters:{q:string;category:string;from:string;to:string},cursor?:string|null):RequestInit {
  return {method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,...filters,category:mode==='reports'?filters.category:'',...(cursor?{cursor}:{})})};
}
const dateLabel=(value:string)=>new Date(value.length===10?`${value}T12:00:00`:value).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
const sortRecords=(a:MedicalTimelineItem,b:MedicalTimelineItem)=>new Date(medicalRecordDate(b)).getTime()-new Date(medicalRecordDate(a)).getTime()||b.id.localeCompare(a.id);

export default function MedicalRecordsPanel({userId,onSessionExpired,openReports=false,audit=false}:{userId:string;onSessionExpired?:()=>void;openReports?:boolean;audit?:boolean}) {
  const apiBase=audit?`/api/admin/users/${encodeURIComponent(userId)}`:'/api/users/me';
  const [tab,setTab]=useState<Mode>(openReports?'reports':'prescriptions');
  const [items,setItems]=useState<MedicalTimelineItem[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [adding,setAdding]=useState({reports:openReports,prescriptions:false});
  const [expanded,setExpanded]=useState<string[]>([]),[nextCursor,setNextCursor]=useState<string|null>(null);
  const [refresh,setRefresh]=useState(0),[search,setSearch]=useState(''),[q,setQ]=useState('');
  const [category,setCategory]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('');
  const [preview,setPreview]=useState<{src:string;name:string}|null>(null);
  const generation=useRef(0);
  useEffect(()=>{const timer=setTimeout(()=>setQ(search.trim()),350);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{setItems([]);setExpanded([]);setNotice('');setPreview(null);setSearch('');setQ('');setCategory('');setFrom('');setTo('');setAdding({reports:openReports,prescriptions:false});},[userId,openReports]);
  useEffect(()=>{
    generation.current++;
    const controller=new AbortController();
    setItems([]);setNextCursor(null);setError('');
    const load=async(silent=false)=>{
      if(!silent)setLoading(true);
      try {
        const response=await fetch(`${apiBase}/medical-records/history`,{...recordRequest(tab,{q,category,from,to}),signal:controller.signal});
        if(response.status===401)onSessionExpired?.();
        const payload=await response.json();
        if(!response.ok||!payload.success)throw new Error(payload.message||'Unable to load records.');
        if(controller.signal.aborted)return;
        const incoming:MedicalTimelineItem[]=payload.data.items;
        if(silent)setItems(previous=>Array.from(new Map([...previous,...incoming].map(item=>[`${item.kind}:${item.id}`,item])).values()).sort(sortRecords));
        else {setItems(incoming);setNextCursor(payload.data.nextCursor);}
        setError('');
      } catch(error) {if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Unable to load records.');}
      finally {if(!controller.signal.aborted&&!silent)setLoading(false);}
    };
    void load();
    const visible=()=>{if(document.visibilityState==='visible')void load(true);};
    const timer=setInterval(visible,30_000);document.addEventListener('visibilitychange',visible);
    return()=>{generation.current++;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[userId,tab,q,category,from,to,refresh,onSessionExpired,apiBase]);
  const loadMore=async()=>{
    if(!nextCursor||loading)return;setLoading(true);
    const requestGeneration=generation.current;
    try {
      const response=await fetch(`${apiBase}/medical-records/history`,recordRequest(tab,{q,category,from,to},nextCursor));
      if(response.status===401)onSessionExpired?.();
      const payload=await response.json();if(!response.ok||!payload.success)throw new Error(payload.message||'Unable to load older records.');
      if(requestGeneration!==generation.current)return;
      setItems(previous=>Array.from(new Map([...previous,...payload.data.items].map(item=>[`${item.kind}:${item.id}`,item])).values()).sort(sortRecords));setNextCursor(payload.data.nextCursor);
    } catch(error) {if(requestGeneration===generation.current)setError(error instanceof Error?error.message:'Unable to load older records.');}finally{if(requestGeneration===generation.current)setLoading(false);}
  };
  const toggle=async(item:MedicalTimelineItem)=>{
    setExpanded(values=>values.includes(item.id)?values.filter(id=>id!==item.id):[...values,item.id]);
    if(!audit&&item.kind==='doctor-prescription'&&!item.readAt) {
      try {const response=await fetch(`${apiBase}/prescriptions/${item.id}`,{method:'PATCH',credentials:'include'});if(response.ok)setItems(values=>values.map(row=>row.id===item.id&&row.kind==='doctor-prescription'?{...row,readAt:new Date().toISOString()}:row));}catch{/* Read marker can retry later. */}
    }
  };
  return <section data-analytics-private aria-labelledby="medical-records-heading" className="mb-10 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-7"><div><p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-rose-700"><LockKeyhole className="h-4 w-4"/>{audit?'Authorized profile audit · view only':'Private records · accessible to you and authorized administrators'}</p><h2 id="medical-records-heading" className="text-2xl font-semibold tracking-tight text-slate-900">Your medical records</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">A dated history of your tests, reports and prescriptions, together in one private place.</p></div><button type="button" onClick={()=>setRefresh(value=>value+1)} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/>Refresh</button></div>
    <div className="space-y-6 p-4 sm:p-7">
      <div role="tablist" aria-label="Medical records" className="flex flex-wrap gap-2">{(['prescriptions','reports'] as const).map(value=><button key={value} role="tab" type="button" id={`medical-tab-${value}`} aria-selected={tab===value} aria-controls={`medical-content-${value}`} onClick={()=>{setTab(value);setNotice('');setError('');setExpanded([]);}} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${tab===value?'bg-slate-900 text-white':'bg-slate-100 text-slate-600 hover:bg-rose-50'}`}>{value==='reports'?<ClipboardList className="h-4 w-4"/>:<Stethoscope className="h-4 w-4"/>}{value==='reports'?'Reports':'Prescriptions'}</button>)}</div>
      {!audit&&(['reports','prescriptions'] as const).map(mode=><div key={mode} hidden={tab!==mode} className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-lg text-sm leading-6 text-slate-600">{mode==='reports'?'Keep each test and its pages together.':'Receive prescriptions from your doctor or upload your own copy with the doctor name and date.'}</p><button type="button" aria-expanded={adding[mode]} onClick={()=>setAdding(value=>({...value,[mode]:!value[mode]}))} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-rose-700"><FilePlus2 className="h-4 w-4"/>{adding[mode]?'Hide upload':mode==='reports'?'Add reports':'Upload prescriptions'}</button></div><div hidden={!adding[mode]}><MedicalRecordUploader key={`${userId}-${mode}`} mode={mode} onSessionExpired={onSessionExpired} onSaved={(count,remaining)=>{setNotice(`${count} ${count===1?'entry':'entries'} saved privately.`+(remaining?' Unsaved entries remain in the form.':''));if(!remaining)setAdding(value=>({...value,[mode]:false}));setRefresh(value=>value+1);}}/></div></div>)}
      {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="space-y-4 border-t border-slate-100 pt-6"><div><h3 className="text-lg font-semibold text-slate-900">{tab==='reports'?'Report':'Prescription'} timeline</h3><p className="mt-1 text-xs leading-5 text-slate-500">Newest test or prescription date first. Upload dates do not change the clinical date.</p></div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="min-w-0 text-xs font-semibold text-slate-600">Find a record<div className="relative"><Search className="pointer-events-none absolute left-3 top-6 h-4 w-4 text-slate-400"/><input type="search" aria-label="Search medical records" maxLength={200} placeholder="Test, doctor, result, notes…" value={search} onChange={e=>setSearch(e.target.value)} className={`${medicalFieldClass} pl-10`}/></div></label>{tab==='reports'&&<label className="min-w-0 text-xs font-semibold text-slate-600">Category<select value={category} onChange={e=>setCategory(e.target.value)} className={medicalFieldClass}><option value="">All categories</option>{REPORT_CATEGORIES.map(value=><option key={value}>{value}</option>)}</select></label>}<label className="min-w-0 text-xs font-semibold text-slate-600">From date<input type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)} className={medicalFieldClass}/></label><label className="min-w-0 text-xs font-semibold text-slate-600">To date<input type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)} className={medicalFieldClass}/></label></div>
        {(search||category||from||to)&&<button type="button" onClick={()=>{setSearch('');setQ('');setCategory('');setFrom('');setTo('');}} className="min-h-10 px-2 text-sm font-semibold text-rose-700">Clear filters</button>}
      </div>
      {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      <div role="tabpanel" id={`medical-content-${tab}`} aria-labelledby={`medical-tab-${tab}`}>
        {loading&&!items.length?<p role="status" className="text-sm text-slate-600">Loading your history…</p>:!items.length&&!error?<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><FileText className="mx-auto mb-3 h-7 w-7 text-rose-700"/><h3 className="font-semibold text-slate-900">{search||category||from||to?'No matching records in this part of your history':'Your timeline is ready'}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{nextCursor?'Continue to older records to check more history.':tab==='prescriptions'?'Upload a prescription or share your patient ID with your doctor to receive one here.':'Add your reports and test details to start your private history.'}</p></div>:null}
        {!!items.length&&<ol className="ml-2 space-y-5 border-l border-rose-200">{items.map(item=>{
          const document=item.kind!=='doctor-prescription'?item:null, opened=expanded.includes(item.id);
          const title=document?document.title:`Dr. ${item.kind==='doctor-prescription'?item.doctor.name:''}`;
          return <li key={`${item.kind}-${item.id}`} className="relative min-w-0 pl-5 sm:pl-6"><span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-rose-600 ring-4 ring-white"/><time dateTime={medicalRecordDate(item)} className="mb-2 block text-xs font-semibold text-rose-700">{dateLabel(medicalRecordDate(item))}</time><article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button type="button" aria-expanded={opened} onClick={()=>void toggle(item)} className="block w-full min-w-0 p-4 text-left sm:p-5"><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{document?document.category:'Prescription'}</span><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">{document?(item.kind==='uploaded-prescription'?'Uploaded by you':`${document.files.length} attached ${document.files.length===1?'page':'pages'}`):'Received from doctor'}</span>{item.kind==='doctor-prescription'&&!item.readAt&&<span className="text-xs font-semibold text-rose-700">New</span>}</div><h3 className="break-words text-base font-semibold text-slate-900">{title}</h3><p className="mt-2 break-words text-sm leading-6 text-slate-600">{document?[document.testName,document.facility,document.clinician&&`Dr. ${document.clinician}`].filter(Boolean).join(' · '):item.kind==='doctor-prescription'?[item.doctor.specialty,item.doctor.clinic].filter(Boolean).join(' · '):''}</p>{document&&!!document.results?.length&&<p className="mt-2 break-words text-sm leading-6 text-slate-700">{document.results.slice(0,3).map(row=>`${row.test}: ${row.value}${row.unit?` ${row.unit}`:''}`).join(' · ')}</p>}<p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-600">{document?(document.impression||document.findings||document.notes):item.kind==='doctor-prescription'?item.diagnosis:''}</p><span className="mt-3 inline-block text-xs font-semibold text-rose-700">{opened?'Hide details':'View details and files'}</span></button>
            {opened&&<div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">{document?<DocumentDetails apiBase={apiBase} item={document} onPreview={setPreview}/>:item.kind==='doctor-prescription'?<><p className="text-xs leading-5 text-slate-500">Prescriber registration: {item.doctor.registrationNumber} · Email: {item.emailStatus.toLowerCase()}</p>{item.diagnosis&&<RecordText title="Diagnosis" text={item.diagnosis}/>}<div className="grid gap-3 sm:grid-cols-2">{item.medications.map((medicine,index)=><div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h4 className="font-semibold text-slate-900">{medicine.name}</h4><p className="mt-2 text-sm leading-6 text-slate-600">Dose: {medicine.dose}<br/>Frequency: {medicine.frequency}<br/>Duration: {medicine.duration}</p>{medicine.instructions&&<RecordText title="Instructions" text={medicine.instructions}/>}</div>)}</div>{item.advice&&<RecordText title="Advice" text={item.advice}/>} {item.followUp&&<RecordText title="Follow-up" text={item.followUp}/>}<a href={`${apiBase}/prescriptions/${item.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700"><Download className="h-4 w-4"/>Download full prescription</a></>:null}</div>}
          </article></li>;
        })}</ol>}
        {nextCursor&&<button type="button" onClick={()=>void loadMore()} disabled={loading} className="mt-5 min-h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 disabled:opacity-50">{loading?'Loading…':'Load older records'}</button>}
      </div>
    </div>
    {preview&&<MedicalImagePreview {...preview} onClose={()=>setPreview(null)}/>}
  </section>;
}

function DocumentDetails({item,onPreview,apiBase}:{apiBase:string;item:MedicalDocument;onPreview:(value:{src:string;name:string})=>void}) {
  return <><dl className="grid gap-4 text-sm sm:grid-cols-2">{[['Test / examination',item.testName],['Record number',item.referenceNumber],['Doctor',item.clinician],['Specialty',item.doctorSpecialty],['Doctor registration',item.doctorRegistration],['Hospital / clinic',item.facility],['Sample type',item.sampleType],['Sample collected',item.sampleCollectedOn],['Examination site',item.bodySite],['Follow-up',item.followUpDate]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-800">{value}</dd></div>)}</dl>{item.reason&&<RecordText title="Reason / diagnosis" text={item.reason}/>} {item.findings&&<RecordText title="Findings" text={item.findings}/>} {item.impression&&<RecordText title="Impression / conclusion" text={item.impression}/>} {!!item.results?.length&&<div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} aria-label="Individual test results"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr>{['Test','Result','Unit','Reference range','Flag (as reported)'].map(label=><th key={label} className="whitespace-nowrap px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{item.results.map((row,index)=><tr key={index} className="border-t border-slate-100">{[row.test,row.value,row.unit,row.referenceRange,row.flag].map((value,column)=><td key={column} className="min-w-20 whitespace-pre-wrap break-words px-3 py-3 text-slate-700">{value||'—'}</td>)}</tr>)}</tbody></table></div>} {item.notes&&<RecordText title={item.kind==='uploaded-prescription'?'Medicines, instructions and notes':'Results and notes'} text={item.notes}/>}<div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">{item.files.map(file=><SavedAttachment apiBase={apiBase} key={file.id} reportId={item.id} file={file} onPreview={onPreview}/>)}</div><p className="text-xs leading-5 text-slate-500">Saved {dateLabel(item.createdAt)}. Your uploaded details are retained as entered.</p></>;
}
function SavedAttachment({reportId,file,onPreview,apiBase}:{apiBase:string;reportId:string;file:MedicalDocument['files'][number];onPreview:(value:{src:string;name:string})=>void}) {
  const [failed,setFailed]=useState(false),path=`${apiBase}/medical-reports/${reportId}/files/${file.id}`;
  const image=file.mimeType?.startsWith('image/')||/\.webp$/i.test(file.name);
  return <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200">{image&&!failed&&<button type="button" onClick={()=>onPreview({src:`${path}?preview=1`,name:file.name})} aria-label={`Preview ${file.name}`} className="relative block w-full bg-slate-50"><img src={`${path}?preview=1`} alt={file.name} loading="lazy" decoding="async" onError={()=>setFailed(true)} className="h-36 w-full object-contain"/><ZoomIn className="absolute bottom-2 right-2 h-5 w-5 text-slate-600"/></button>}<a href={path} className="flex min-h-12 items-start gap-2 p-3 text-sm text-slate-700 hover:bg-slate-50"><Download className="mt-0.5 h-4 w-4 shrink-0"/><span className="min-w-0 break-all">{file.name}{file.sizeBytes!==undefined&&<span className="mt-1 block text-xs text-slate-500">{medicalBytes(file.sizeBytes)}</span>}</span></a></div>;
}
function RecordText({title,text}:{title:string;text:string}) {return <div><h4 className="text-sm font-semibold text-slate-900">{title}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{text}</p></div>;}
