'use client';
import React,{useEffect,useState} from 'react';
import {publishPublicUiControls,UI_CONTROLS_EVENT} from '@/src/lib/publicUiControls';

export default function PatientIdVisibilityControl(){
  const [visible,setVisible]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{
    let active=true;
    const changed=(event:Event)=>{const value=(event as CustomEvent).detail;if(typeof value?.patientIdVisible==='boolean')setVisible(value.patientIdVisible);};
    window.addEventListener(UI_CONTROLS_EVENT,changed);
    void fetch('/api/admin/site-controls',{cache:'no-store',credentials:'include'}).then(async response=>{
      const body=await response.json();if(!response.ok||!body.success)throw Error(body.message||'Could not load patient ID visibility.');
      if(active)setVisible(body.data.patientIdVisible===true);
    }).catch(error=>{if(active)setMessage(error.message);});
    return()=>{active=false;window.removeEventListener(UI_CONTROLS_EVENT,changed);};
  },[]);
  async function toggle(){
    if(visible===null||busy)return;setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/admin/site-controls',{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({patientIdVisible:!visible})});
      const body=await response.json();if(!response.ok||!body.success)throw Error(body.message||'Could not save patient ID visibility.');
      setVisible(body.data.patientIdVisible);publishPublicUiControls(body.data);
      setMessage(body.data.patientIdVisible?'Patient ID cards are visible in user profiles.':'Patient ID cards are hidden. IDs and prescription delivery remain active.');
    }catch(error){setMessage(error instanceof Error?error.message:'Could not save patient ID visibility.');}finally{setBusy(false);}
  }
  return <section id="switch-patient-id" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1b23]">
    <div className="flex flex-wrap items-center justify-between gap-4"><div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visible patient ID</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-gray-400">Show or hide the patient ID card in every user profile. Open profiles update automatically. Existing IDs, editing rules and prescription delivery stay active.</p>
    </div><button type="button" role="switch" aria-label="Visible patient ID" aria-checked={visible===true} disabled={busy||visible===null} onClick={()=>void toggle()} className={`inline-flex min-w-28 items-center justify-center gap-3 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50 ${visible?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-700'}`}>
      <span aria-hidden="true" className={`relative h-5 w-9 rounded-full ${visible?'bg-emerald-600':'bg-slate-400'}`}><span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${visible?'translate-x-4':'translate-x-0.5'}`}/></span>{busy?'Saving…':visible===null?'Loading…':visible?'Visible':'Hidden'}
    </button></div>{message&&<p role="status" className="mt-3 text-sm text-gray-600 dark:text-gray-300">{message}</p>}
  </section>;
}
