'use client';
import {createContext,Suspense,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import type {NotificationDestination} from '@/src/lib/notificationTargets';
import {createPortal} from 'react-dom';

const Context=createContext<NotificationDestination&{revision:number}|null>(null);
export const useNotificationFocus=()=>useContext(Context);
export function NotificationFocusProvider({children}:{children:ReactNode}){
 const [focus,setFocus]=useState<(NotificationDestination&{revision:number})|null>(null);
 return <Context.Provider value={focus}><Suspense fallback={null}><FocusController onChange={setFocus}/></Suspense>{children}</Context.Provider>;
}
function FocusController({onChange}:{onChange:(value:(NotificationDestination&{revision:number})|null)=>void}){
 const params=useSearchParams(),pathname=usePathname(),router=useRouter(),id=params.get('notification');
 const [activation,setActivation]=useState(0),[message,setMessage]=useState(''),[resolved,setResolved]=useState<NotificationDestination|null>(null),[readError,setReadError]=useState(false);
 const revision=useRef(0);
 useEffect(()=>{const activate=()=>setActivation(n=>n+1);window.addEventListener('bloodnet:notification-open',activate);return()=>window.removeEventListener('bloodnet:notification-open',activate);},[]);
 useEffect(()=>{
  if(!id){onChange(null);setResolved(null);setMessage('');return;}
  if(!/^[0-9a-f-]{36}$/i.test(id)){setMessage('Invalid notification reference.');onChange(null);return;}
  let stopped=false;let observer:MutationObserver|undefined;let timer:ReturnType<typeof setTimeout>|undefined;let cleanup:ReturnType<typeof setTimeout>|undefined;let highlighted:HTMLElement|null=null;
  const markRead=async()=>{try{const r=await fetch('/api/admin/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[id],read:true}),keepalive:true});if(!r.ok)throw Error();if(!stopped){setReadError(false);window.dispatchEvent(new Event('bloodnet:notification-read'));}}catch{if(!stopped)setReadError(true);}};
  const locate=async(attempt:number)=>{
   try{
    const r=await fetch('/api/admin/notifications/'+id+'/destination',{cache:'no-store'}),payload=await r.json();if(!r.ok||!payload.success)throw Error(payload.message||'Notification destination could not load.');if(stopped)return;
    const value=payload.data as NotificationDestination;setResolved(value);
    if(value.href!==pathname){router.replace(value.href+'?notification='+encodeURIComponent(id));return;}
    onChange({...value,revision:++revision.current});setMessage(value.message||'');
    if(value.status!=='found')return;
    // Reveal editor disclosures before their async children are available.
    if(value.section){const section=document.getElementById(value.section);if(section instanceof HTMLDetailsElement)section.open=true;section?.closest('details')?.setAttribute('open','');}
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    if(stopped)return;
    const find=()=>{
     if(stopped)return false;
     const exact=value.marker?Array.from(document.querySelectorAll<HTMLElement>('[data-notification-target]')).find(node=>node.dataset.notificationTarget===value.marker):null;
     const node=exact||(value.section?document.getElementById(value.section):null);
     // Record editors signal readiness only after selecting the requested entry.
     if(!node||node.dataset.notificationPending==='true'||node.closest('[hidden]'))return false;
     for(let parent:HTMLElement|null=node;parent;parent=parent.parentElement)if(parent instanceof HTMLDetailsElement)parent.open=true;
     const disclosure=node.querySelector(':scope > details');if(disclosure instanceof HTMLDetailsElement)disclosure.open=true;
     observer?.disconnect();if(timer)clearTimeout(timer);highlighted=node;
     node.classList.remove('bn-notification-highlight');void node.offsetWidth;node.classList.add('bn-notification-highlight');node.setAttribute('tabindex','-1');
     const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
     node.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'});node.focus({preventScroll:true});
     cleanup=setTimeout(()=>node.classList.remove('bn-notification-highlight'),2400);
     setMessage('Opened the item for this notification.');return true;
    };
    if(find())return;
    observer=new MutationObserver(()=>{find();});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-notification-target','data-notification-pending','open']});
    timer=setTimeout(()=>{observer?.disconnect();if(attempt===0)void locate(1);else setMessage('The item could not be located in the refreshed list. Reload the destination to try again.');},6000);
   }catch(e){if(!stopped){setMessage((e as Error).message);onChange(null);}}
  };
  setMessage('Locating notification…');setReadError(false);void markRead();void locate(0);
  return()=>{stopped=true;observer?.disconnect();if(timer)clearTimeout(timer);if(cleanup)clearTimeout(cleanup);highlighted?.classList.remove('bn-notification-highlight');};
 },[id,pathname,activation,onChange,router]);
 const retryRead=useCallback(async()=>{try{const r=await fetch('/api/admin/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[id],read:true})});if(!r.ok)throw Error();setReadError(false);window.dispatchEvent(new Event('bloodnet:notification-read'));}catch{setReadError(true);}},[id]);
 if(!id)return null;
 const host=typeof document==='undefined'?null:document.getElementById('notification-location');
 return host?createPortal(<aside className="bn-notification-location" role="status"><span>{message}</span>{readError&&<><span>Read status could not save.</span><button onClick={()=>void retryRead()}>Retry marking read</button></>}{resolved?.related?.map(link=><a key={link.href} href={link.href}>{link.label}</a>)}<button onClick={()=>{const next=new URLSearchParams(params.toString());next.delete('notification');router.replace(pathname+(next.size?'?'+next.toString():''),{scroll:false});}}>Dismiss</button></aside>,host):null;
}

/** Reveal a lazily-loaded editor, then select its record without publishing it. */
export function useNotificationEditor(kind:string,loaded:boolean,select:()=>void){
 const focus=useNotificationFocus();const selectRef=useRef(select);selectRef.current=select;
 useEffect(()=>{if(focus?.target?.kind!==kind||focus.status!=='found'||!loaded)return;selectRef.current();},[focus?.revision,focus?.target?.kind,kind,loaded]);
 return focus?.target?.kind===kind?focus:null;
}

export function useNotificationPage(kind:string,navigate:(page:number)=>void){
 const focus=useNotificationFocus(),latest=useRef(navigate);latest.current=navigate;
 useEffect(()=>{if(focus?.target?.kind===kind&&focus.status==='found')latest.current(focus.page||1);},[kind,focus?.revision]);
 return focus?.target?.kind===kind?focus:null;
}

export function NotificationOperationTarget({kinds}:{kinds:string[]}){
 const focus=useNotificationFocus();
 if(!focus?.target||focus.status!=='found'||!focus.operation||!kinds.includes(focus.target.kind))return null;
 return <section data-notification-target={focus.marker} className="admin-stat"><p className="bn-kicker">Notification reference</p><h3>{focus.operation.label}</h3><p>Status: {focus.operation.status}</p><p className="text-xs">Reference: {focus.target.id}</p><p className="text-xs">Operational metadata only. Private documents and clinical contents are not displayed here.</p></section>;
}
