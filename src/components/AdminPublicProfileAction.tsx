"use client";
import React,{useEffect,useRef,useState} from 'react';
import {Globe2,LoaderCircle} from 'lucide-react';

export const PUBLIC_PROFILE_UPDATED='bloodnet:public-profile-updated';
export default function AdminPublicProfileAction({userId,name,active,isPublished,publicPath,onChanged,onError}:{userId:string;name:string;active:boolean;isPublished:boolean;publicPath:string|null;onChanged:()=>void;onError:(message:string)=>void}) {
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),request=useRef<AbortController|null>(null),working=useRef(false);
 const [busy,setBusy]=useState(false);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
 useEffect(()=>()=>{cancel();request.current?.abort();},[userId]);
 const publish=async()=>{
  if(working.current)return;working.current=true;setBusy(true);request.current=new AbortController();
  try{const response=await fetch(`/api/admin/users/${encodeURIComponent(userId)}/public-profile`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({quickPublish:true,isPublished:!isPublished}),signal:request.current.signal}),body=await response.json();if(!response.ok||!body.success)throw new Error(body.message||'Could not update public profile.');onChanged();}
  catch(error){if(!(error instanceof Error&&error.name==='AbortError'))onError(error instanceof Error?error.message:'Could not update public profile.');}
  finally{working.current=false;setBusy(false);}
 };
 const open=()=>{cancel();if(publicPath)window.open(publicPath,'_blank','noopener,noreferrer');else onError('Publish this profile first to create its public URL.');};
 const hint=`${isPublished?'Hide public profile':'Publish profile without phone number'} for ${name}. Double-click to open the public link. Ctrl+Enter opens the link.`;
 return <button type="button" aria-label={hint} title={hint} aria-pressed={isPublished} disabled={busy||(!active&&!isPublished)} onClick={event=>{cancel();if(event.detail===0)void publish();else if(event.detail===1)timer.current=setTimeout(()=>void publish(),600);}} onDoubleClick={open} onKeyDown={event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();open();}}} className={`rounded-lg p-2 transition disabled:opacity-40 ${isPublished?'bg-emerald-50 text-emerald-600 hover:bg-emerald-100':'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}>
  {busy?<LoaderCircle size={16} className="animate-spin"/>:<Globe2 size={16}/>}
 </button>;
}
