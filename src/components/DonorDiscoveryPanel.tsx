"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Compass, Globe2, Plus, X } from 'lucide-react';
import DonorCountryFilter from './DonorCountryFilter';
import useDonorRegion from './useDonorRegion';
import { UI_CONTROLS_EVENT } from '../lib/publicUiControls';
import { isDiscoveryPath } from '../lib/discoveryRoutes';
import DiscoveryReadingRoom from './DiscoveryReadingRoom';

export default function DonorDiscoveryPanel({children,forcedCountry}:{children?:ReactNode;forcedCountry?:string}) {
  const dialog=useRef<HTMLDialogElement>(null),surface=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const region=useDonorRegion(forcedCountry);
  const [open,setOpen]=useState(false),[page,setPage]=useState(''),[loading,setLoading]=useState(false);
  const [visible,setVisible]=useState(true);
  const closing=useRef(false);
  const animationEngine=useRef<typeof import('gsap/dist/gsap').gsap|null>(null);
  const close=()=>{
    if(closing.current||!dialog.current?.open)return;
    closing.current=true;
    const finish=()=>{dialog.current?.close();setOpen(false);setPage('');closing.current=false;trigger.current?.focus();};
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!animationEngine.current)finish();
    else animationEngine.current.to(surface.current,{opacity:0,y:12,scale:0.985,duration:0.18,ease:'power2.in',onComplete:finish});
  };
  useEffect(()=>{
    if(!open)return;
    const element=dialog.current!;
    element.showModal();
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    let active=true;
    let animation:ReturnType<typeof import('gsap/dist/gsap').gsap.fromTo>|undefined;
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if(surface.current)surface.current.style.opacity='0';
      void import('gsap/dist/gsap').then(({gsap})=>{
        if(!active)return;
        animationEngine.current=gsap;
        animation=gsap.fromTo(surface.current,{opacity:0,y:20,scale:0.975},{opacity:1,y:0,scale:1,duration:0.45,ease:'power3.out'});
      }).catch(()=>{if(active&&surface.current)surface.current.style.opacity='1';});
    }else if(surface.current)surface.current.style.opacity='1';
    const desktop=window.matchMedia('(min-width: 1024px)');
    const resized=()=>{if(!desktop.matches)close();};
    desktop.addEventListener('change',resized);
    return()=>{active=false;animation?.kill();desktop.removeEventListener('change',resized);document.body.style.overflow=previousOverflow;};
  },[open]);
  const navigate=(href:string)=>{
    const url=new URL(href,window.location.origin);
    if(url.origin!==window.location.origin||!isDiscoveryPath(url.pathname))return false;
    url.searchParams.set('donorExplore','1');setLoading(true);setPage(url.pathname+url.search);return true;
  };
  useEffect(()=>{
    const sync=()=>{const show=document.documentElement.getAttribute('data-discovery-visible')!=='false';setVisible(show);if(!show){if(surface.current)animationEngine.current?.killTweensOf(surface.current);dialog.current?.close();closing.current=false;setOpen(false);setPage('');}};
    sync();window.addEventListener(UI_CONTROLS_EVENT,sync);return()=>window.removeEventListener(UI_CONTROLS_EVENT,sync);
  },[]);
  if(!visible)return null;
  return <>
    <button ref={trigger} type="button" onClick={()=>setOpen(true)} className="donor-discovery-trigger" aria-label="Explore donor locations and location preferences" aria-haspopup="dialog" aria-expanded={open} aria-controls="donor-discovery-dialog" data-analytics-component="Donor discovery open"><Plus size={22} strokeWidth={1.7}/><span className="donor-discovery-tooltip">Explore your community</span></button>
    <dialog ref={dialog} id="donor-discovery-dialog" className="donor-discovery-dialog" aria-labelledby="discovery-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===dialog.current)close();}}>
      <div ref={surface} className="donor-discovery-surface">
        <header className="discovery-header">
          <div className="flex min-w-0 items-center gap-3"><span className="discovery-symbol"><Compass size={22}/></span><div><p className="discovery-eyebrow">BloodNet / Discover</p><h2 id="discovery-title" className="text-lg font-semibold tracking-tight text-slate-900">Care, closer to you.</h2></div></div>
          <div className="flex items-center gap-2">{page&&<button type="button" className="discovery-icon-button" aria-label="Back to discovery" onClick={()=>{setPage('');setLoading(false);}}><ArrowLeft size={18}/></button>}<button type="button" className="discovery-icon-button" aria-label="Close donor discovery" onClick={close}><X size={19}/></button></div>
        </header>
        {page ? <div className="discovery-frame-wrap">{loading&&<p role="status" className="discovery-loading">Loading donor directory…</p>}<iframe key={page} src={page} title="BloodNet donor directory" className="discovery-frame" onLoad={event=>{setLoading(false);try{event.currentTarget.contentDocument?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});}catch{/* A destination outside the same-origin directory cannot be inspected. */}}}/></div> : <div className="discovery-scroll" onClick={event=>{const link=(event.target as HTMLElement).closest('a');if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&link.target!=='_blank'&&navigate(link.href))event.preventDefault();}}>
          <div className="discovery-intro"><div><p className="discovery-eyebrow">Your local network</p><h3>Find a connection.<br/><span>Make a difference.</span></h3><p>Explore active donor communities and personalise the listings you see. The same BloodNet network, with a more local view.</p></div><div className="discovery-preferences"><div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900"><Globe2 size={17}/> Location preferences</div><DonorCountryFilter country={region.country} onChange={region.chooseCountry} locked={Boolean(forcedCountry)} onLocate={()=>void region.confirmLocation()} locating={region.locating} locationMessage={region.locationMessage}/></div></div>
          <nav className="discovery-shortcuts" aria-label="Explore donor directories">{[['/cities','Browse cities'],['/countries','Explore countries'],['/common-blood-searches','Find blood donors'],['/common-organ-searches','Find organ donors'],['/guides','Read the guides'],['/network','Network & data']].map(([href,label])=><a key={href} href={href}>{label}<ArrowUpRight size={16}/></a>)}</nav>
          <DiscoveryReadingRoom />
          {children || <div className="px-8 pb-8"><a href="/cities" className="font-semibold text-rose-700">View active donor locations →</a></div>}
        </div>}
        <footer className="discovery-footer"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Connected to the current donor directory<span className="ml-auto">A community built around care.</span></footer>
      </div>
    </dialog>
  </>;
}
