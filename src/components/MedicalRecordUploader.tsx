'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, FileText, ImagePlus, Plus, Trash2, X, ZoomIn } from 'lucide-react';
import { MAX_MEDICAL_FILES, MAX_MEDICAL_FILE_BYTES, MAX_MEDICAL_TOTAL_BYTES, REPORT_CATEGORIES, type MedicalReportDetails, type MedicalDocument } from '@/src/lib/medicalRecords';

export const medicalFieldClass = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-base font-normal text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-700 focus:ring-2 focus:ring-rose-700/10';
type Result = NonNullable<MedicalReportDetails['results']>[number];
type Draft = Omit<MedicalReportDetails,'files'> & {key:string;files:File[];error:string};
const fresh = (prescription:boolean):Draft => ({key:crypto.randomUUID(),title:'',category:prescription?'Prescription':'Lab result',reportDate:'',facility:'',clinician:'',notes:'',testName:'',referenceNumber:'',sampleType:'',sampleCollectedOn:'',bodySite:'',reason:'',findings:'',impression:'',followUpDate:'',doctorSpecialty:'',doctorRegistration:'',results:[],files:[],error:''});
export const medicalBytes = (size:number) => size<1024*1024?`${Math.round(size/1024)} KB`:`${(size/1024/1024).toFixed(1)} MB`;

export default function MedicalRecordUploader({mode,userId,onSaved,onSessionExpired}:{mode:'reports'|'prescriptions';userId:string;onSaved:(count:number,remaining:number,records:MedicalDocument[])=>void;onSessionExpired?:()=>void}) {
  const prescription=mode==='prescriptions';
  const [drafts,setDrafts]=useState<Draft[]>(()=>[fresh(prescription)]);
  const [uploading,setUploading]=useState(false);
  const [progress,setProgress]=useState('');
  const [submissionError,setSubmissionError]=useState('');
  const errorRef=useRef<HTMLParagraphElement>(null);
  useEffect(()=>{if(submissionError)errorRef.current?.scrollIntoView?.({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},[submissionError]);
  const update=(key:string,patch:Partial<Draft>)=>setDrafts(items=>items.map(item=>item.key===key?{...item,...patch,error:''}:item));
  const now=new Date(), today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    setSubmissionError('');
    if(drafts.some(item=>!item.files.length)) {setDrafts(items=>items.map(item=>({...item,error:item.files.length?'':'Add at least one file to this entry.'})));return;}
    setUploading(true);let saved=0;const savedRecords:MedicalDocument[]=[];
    // One request per record keeps the existing 20 MB limit and isolates failed entries.
    for(let index=0;index<drafts.length;index++) {
      const item=drafts[index];setProgress(`Saving ${index+1} of ${drafts.length}…`);
      const body=new FormData();
      for(const [name,value] of Object.entries(item)) {
        if(['files','error','key','results'].includes(name))continue;
        body.set(name,String(value||''));
      }
      body.set('uploadKey',item.key);body.set('results',JSON.stringify(item.results||[]));
      item.files.forEach(file=>body.append('files',file));
      try {
        const response=await fetch(`/api/users/me/${prescription?'prescriptions':'medical-reports'}`,{method:'POST',credentials:'include',headers:{'X-BloodNet-Profile':userId},body});
        if(response.status===401)onSessionExpired?.();
        const payload=await response.json();
        if(!response.ok||!payload.success)throw new Error(payload.message||'This entry could not be saved.');
        if(!payload.data?.id)throw new Error('The server did not return a saved record. Keep your files and retry.');
        const confirmation=await fetch('/api/users/me/medical-records/history',{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json','X-BloodNet-Profile':userId},body:JSON.stringify({mode,verifyUpload:payload.data.id})});
        if(confirmation.status===401)onSessionExpired?.();
        const confirmed=await confirmation.json();
        const record=confirmed.data?.verifiedUpload;
        if(!confirmation.ok||!confirmed.success||record?.id!==payload.data.id||record?.kind!==(prescription?'uploaded-prescription':'report')||!record.files?.length)throw new Error(confirmed.message||'The upload was received, but could not be confirmed in your timeline. Keep your files and retry; the same entry will not be duplicated.');
        savedRecords.push(record);saved++;setDrafts(items=>items.filter(draft=>draft.key!==item.key));
      } catch(error) {
        setSubmissionError(error instanceof Error?error.message:'Upload failed. Your files are still selected; retry this entry.');
        setDrafts(items=>items.map(draft=>draft.key===item.key?{...draft,error:error instanceof Error?error.message:'Upload failed. Retry this entry.'}:draft));
        // Keep the unsaved draft, files and stable upload key for safe retries.
      }
    }
    setUploading(false);setProgress('');
    if(saved===drafts.length)setDrafts([fresh(prescription)]);
    if(saved)onSaved(saved,drafts.length-saved,savedRecords);
  };
  return <form onSubmit={submit} onInvalidCapture={event=>{const field=event.target as HTMLInputElement;const details=field.closest('details');if(details)details.open=true;setSubmissionError(`${field.closest('label')?.textContent||'Required field'}: ${field.validationMessage}`);}} className="space-y-5">
    <p className="text-sm leading-6 text-slate-600">Add one entry per {prescription?'prescription':'report or test'}. Attach up to five pages to each entry, then save several entries together.</p>
    {submissionError&&<p ref={errorRef} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{submissionError}</p>}
    <fieldset disabled={uploading} className="m-0 min-w-0 space-y-5 border-0 p-0">
      {drafts.map((item,index)=><article key={item.key} className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">{prescription?'Prescription':'Report'} {index+1}</h3><button type="button" onClick={()=>setDrafts(items=>items.filter(draft=>draft.key!==item.key))} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4"/>Remove entry</button></div>
        {item.error&&(drafts.length>1||item.error!==submissionError)&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{item.error}</p>}
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <Field label={prescription?'Prescription title':'Report title'} required maxLength={160} value={item.title} onChange={e=>update(item.key,{title:e.target.value})} placeholder={prescription?'e.g. Cardiology follow-up':'e.g. Complete blood count'}/>
          {!prescription&&<label className="min-w-0 text-sm font-semibold text-slate-700">Category<select value={item.category} onChange={e=>update(item.key,{category:e.target.value})} className={medicalFieldClass}>{REPORT_CATEGORIES.map(category=><option key={category}>{category}</option>)}</select></label>}
          <Field label={prescription?'Date prescribed':'Report / test date'} type="date" required max={today} value={item.reportDate} onChange={e=>update(item.key,{reportDate:e.target.value})}/>
          <Field label={prescription?'Doctor name':'Doctor / referring clinician (optional)'} required={prescription} maxLength={160} value={item.clinician} onChange={e=>update(item.key,{clinician:e.target.value})}/>
          <Field label={prescription?'Clinic / hospital (optional)':'Hospital / laboratory'} required={!prescription} maxLength={200} value={item.facility} onChange={e=>update(item.key,{facility:e.target.value})}/>
          {!prescription&&<Field label="Test / examination name (optional)" maxLength={200} value={item.testName} onChange={e=>update(item.key,{testName:e.target.value})} placeholder="e.g. CBC, HbA1c, chest X-ray"/>}
        </div>
        <MedicalFilePicker files={item.files} onChange={files=>update(item.key,{files})}/>
        {!!item.files.length&&<p className="text-xs leading-5 text-slate-600">These files are selected on your device. Tap <strong>Save {prescription?'prescription':'report'}</strong> below to store them in your account.</p>}
        <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-800">Additional {prescription?'prescription':'medical'} details (optional)</summary><div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Record / accession number" maxLength={120} value={item.referenceNumber} onChange={e=>update(item.key,{referenceNumber:e.target.value})}/>
            <Field label="Doctor specialty" maxLength={160} value={item.doctorSpecialty} onChange={e=>update(item.key,{doctorSpecialty:e.target.value})}/>
            <Field label="Doctor registration number" maxLength={120} value={item.doctorRegistration} onChange={e=>update(item.key,{doctorRegistration:e.target.value})}/>
            <Field label="Follow-up date" type="date" value={item.followUpDate} onChange={e=>update(item.key,{followUpDate:e.target.value})}/>
            {!prescription&&<><Field label="Sample / specimen type" maxLength={120} value={item.sampleType} onChange={e=>update(item.key,{sampleType:e.target.value})}/><Field label="Sample collection date" type="date" max={item.reportDate||today} value={item.sampleCollectedOn} onChange={e=>update(item.key,{sampleCollectedOn:e.target.value})}/><Field label="Body area / examination site" maxLength={160} value={item.bodySite} onChange={e=>update(item.key,{bodySite:e.target.value})}/></>}
          </div>
          <TextField label={prescription?'Diagnosis / reason for visit':'Reason for test / examination'} value={item.reason} maxLength={2000} onChange={e=>update(item.key,{reason:e.target.value})}/>
          {!prescription&&<><TextField label="Findings / test information" value={item.findings} maxLength={10000} onChange={e=>update(item.key,{findings:e.target.value})}/><TextField label="Impression / conclusion (as written)" value={item.impression} maxLength={4000} onChange={e=>update(item.key,{impression:e.target.value})}/><ResultsEditor results={item.results||[]} onChange={results=>update(item.key,{results})}/></>}
          <TextField label={prescription?'Medicines, instructions and notes (as written)':'Results and notes'} value={item.notes} maxLength={10000} onChange={e=>update(item.key,{notes:e.target.value})}/>
          <p className="text-xs leading-5 text-slate-500">Copy details exactly as written. Entries and flags you add are not automatically interpreted or medically verified.</p>
        </div></details>
      </article>)}
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={drafts.length>=10} onClick={()=>setDrafts(items=>[...items,fresh(prescription)])} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 disabled:opacity-50"><Plus className="h-4 w-4"/>Add another {prescription?'prescription':'report'}</button><button type="submit" disabled={!drafts.length} className="min-h-12 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">Save {drafts.length>1?`all ${drafts.length} entries`:prescription?'prescription':'report'}</button></div>
    </fieldset>
    {uploading&&<p role="status" className="text-sm font-semibold text-rose-700">{progress} Keep this page open until uploading finishes.</p>}
    <p className="text-xs leading-5 text-slate-500">Up to 10 entries per batch. PDF, JPG, PNG, WEBP; 10 MB per file, 20 MB per entry. Images are resized and optimized before encrypted database storage. PDFs retain their original content.</p>
  </form>;
}

function Field({label,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string}) {return <label className="block min-w-0 text-sm font-semibold text-slate-700">{label}<input {...props} className={medicalFieldClass}/></label>;}
function TextField({label,...props}:React.TextareaHTMLAttributes<HTMLTextAreaElement>&{label:string}) {return <label className="block min-w-0 text-sm font-semibold text-slate-700">{label}<textarea {...props} rows={3} className={medicalFieldClass}/></label>;}
function ResultsEditor({results,onChange}:{results:Result[];onChange:(items:Result[])=>void}) {
  const change=(index:number,field:keyof Result,value:string)=>onChange(results.map((row,i)=>i===index?{...row,[field]:value}:row));
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-slate-800">Individual test results</h4><button type="button" disabled={results.length>=100} onClick={()=>onChange([...results,{test:'',value:'',unit:'',referenceRange:'',flag:''}])} className="min-h-10 rounded-full border border-slate-200 px-4 text-sm text-slate-700">Add test result</button></div>{results.map((row,index)=><div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Test name" required maxLength={160} value={row.test} onChange={e=>change(index,'test',e.target.value)}/><Field label="Result / value" required maxLength={300} value={row.value} onChange={e=>change(index,'value',e.target.value)}/><Field label="Unit" maxLength={80} value={row.unit} onChange={e=>change(index,'unit',e.target.value)}/><Field label="Reference range" maxLength={200} value={row.referenceRange} onChange={e=>change(index,'referenceRange',e.target.value)}/><label className="text-sm font-semibold text-slate-700">Flag (as reported)<select className={medicalFieldClass} value={row.flag} onChange={e=>change(index,'flag',e.target.value)}>{['','Normal','High','Low','See report'].map(flag=><option key={flag} value={flag}>{flag||'Not specified'}</option>)}</select></label></div><button type="button" onClick={()=>onChange(results.filter((_,i)=>i!==index))} className="min-h-10 px-2 text-sm text-rose-700">Remove test result {index+1}</button></div>)}</div>;
}

function MedicalFilePicker({files,onChange}:{files:File[];onChange:(files:File[])=>void}) {
  const id=useId(), fileRef=useRef<HTMLInputElement>(null),cameraRef=useRef<HTMLInputElement>(null);
  const [error,setError]=useState('');
  const [urls,setUrls]=useState<string[]>([]);
  const [preview,setPreview]=useState<number|null>(null);
  useEffect(()=>{const next=files.map(file=>file.type.startsWith('image/')?URL.createObjectURL(file):'');setUrls(next);return()=>next.forEach(url=>{if(url)URL.revokeObjectURL(url);});},[files]);
  const add=(incoming:File[])=>{
    const selected=[...files];
    for(const file of incoming)if(!selected.some(item=>item.name===file.name&&item.size===file.size&&item.lastModified===file.lastModified))selected.push(file);
    if(selected.some(file=>!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))){setError('Use JPG, PNG, WEBP, or PDF. Convert HEIC images before uploading.');return;}
    if(selected.length>MAX_MEDICAL_FILES||selected.some(file=>!file.size||file.size>MAX_MEDICAL_FILE_BYTES)||selected.reduce((sum,file)=>sum+file.size,0)>MAX_MEDICAL_TOTAL_BYTES){setError('Choose up to 5 files, 10 MB each and 20 MB total per entry.');return;}
    setError('');onChange(selected);
  };
  return <div className="space-y-3">
    <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add(Array.from(e.dataTransfer.files));}} className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">Files and pages <span className="font-normal text-slate-500">({files.length}/5)</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Preview each photo to check the right page is attached. Add more files or drop them here.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>fileRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700"><ImagePlus className="h-4 w-4"/>Choose files</button><button type="button" onClick={()=>cameraRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700"><Camera className="h-4 w-4"/>Take photo</button></div>
      <input ref={fileRef} id={id} aria-label="Choose medical files" className="hidden" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>{add(Array.from(e.target.files||[]));e.target.value='';}}/>
      <input ref={cameraRef} aria-label="Take medical document photo" className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>{add(Array.from(e.target.files||[]));e.target.value='';}}/>
      <p className="mt-2 text-xs leading-5 text-slate-500">Camera capture is available on supported mobile devices; other devices open the file picker.</p>
    </div>
    {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
    {!!files.length&&<div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{files.map((file,index)=><div key={`${file.name}-${file.lastModified}-${index}`} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {file.type.startsWith('image/')?<button type="button" aria-label={`Preview ${file.name}`} onClick={()=>setPreview(index)} className="group relative block w-full bg-slate-100">{urls[index]&&<img src={urls[index]} alt={`Selected page: ${file.name}`} className="h-36 w-full object-contain" loading="lazy" decoding="async"/>}<span className="absolute bottom-2 right-2 rounded-full bg-white p-2 text-slate-700 shadow-sm"><ZoomIn className="h-4 w-4"/></span></button>:<div className="flex h-36 items-center justify-center bg-slate-100 text-slate-500"><FileText className="h-10 w-10" aria-label="PDF document"/></div>}
      <div className="p-3"><p className="break-all text-xs font-semibold leading-5 text-slate-700">{file.name}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{medicalBytes(file.size)}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={()=>{setPreview(null);onChange(files.filter((_,i)=>i!==index));}} className="min-h-9 rounded-full px-3 text-xs font-semibold text-rose-700">Remove</button></div></div>
    </div>)}</div>}
    {preview!==null&&urls[preview]&&<MedicalImagePreview src={urls[preview]} name={files[preview].name} onClose={()=>setPreview(null)}/>}
  </div>;
}

export function MedicalImagePreview({src,name,onClose}:{src:string;name:string;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  const [zoomed,setZoomed]=useState(false);
  useEffect(()=>{const dialog=ref.current,opener=document.activeElement as HTMLElement|null;dialog?.showModal();return()=>{dialog?.close();if(opener?.isConnected)opener.focus();};},[]);
  return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-label={`Image preview: ${name}`} className="fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-2rem)] max-w-5xl overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl backdrop:bg-slate-950/70"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="min-w-0 break-all text-sm font-semibold text-slate-800">{name}</p><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={()=>setZoomed(value=>!value)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700"><ZoomIn className="h-4 w-4"/>{zoomed?'Fit to screen':'Zoom to actual size'}</button><button type="button" autoFocus aria-label="Close image preview" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100"><X className="h-5 w-5"/></button></div></div><div className="max-h-[75dvh] overflow-auto rounded-xl bg-slate-50" tabIndex={0} aria-label="Document image; scroll to inspect when zoomed"><img src={src} alt={name} className={zoomed?'mx-auto h-auto w-auto max-w-none':'mx-auto max-h-[75dvh] w-auto max-w-full object-contain'}/></div><p className="mt-3 text-xs text-slate-500">Check names, dates and clinical details. Scroll inside the viewer when zoomed.</p></dialog>;
}
