'use client';
import {imageSrcSet,imageObject} from '@/src/lib/imagePresentation';
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import type {PublicRegionalContent} from '@/src/lib/regionalContent';
const AuthModal=dynamic(()=>import('../AuthModal'),{ssr:false});
export function RegionalAuthActions({registrationOnly=false,appearance="regional",registrationLabel}:{registrationOnly?:boolean;appearance?:"original"|"regional";registrationLabel?:string}){
 const primary=appearance==="original"?"rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white":"region-button";
 const secondary=appearance==="original"?"rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900":"region-button secondary";
 const [mode,setMode]=useState<'login'|'register'|null>(null),[signedIn,setSignedIn]=useState(false);
 useEffect(()=>{const controller=new AbortController();const refresh=()=>{void fetch('/api/auth/session',{credentials:'include',cache:'no-store',signal:controller.signal}).then(response=>response.ok?response.json():null).then(body=>{if(!controller.signal.aborted)setSignedIn(Boolean(body?.user));}).catch(()=>{});};refresh();window.addEventListener('bloodnet:session-changed',refresh);return()=>{controller.abort();window.removeEventListener('bloodnet:session-changed',refresh);};},[]);
 return <><div className="region-actions">{signedIn?<a className={primary} href="/?profile=1">Your BloodNet profile ↗</a>:<>{!registrationOnly&&<button type="button" className={secondary} data-analytics-component="Regional Login" onClick={()=>setMode('login')}>Login</button>}<button type="button" className={primary} data-analytics-component="Regional Register" onClick={()=>setMode('register')}>{registrationOnly?(registrationLabel||'Register as a donor'):'Register'} <span aria-hidden="true">↗</span></button></>}</div>{mode&&<AuthModal key={mode} initialMode={mode} isOpen onClose={()=>setMode(null)} onSuccess={()=>{setMode(null);setSignedIn(true);window.dispatchEvent(new Event('bloodnet:session-changed'));}}/>}</>;
}
export function RegionalGallery({content,priority=false}:{content:PublicRegionalContent;priority?:boolean}){
 const [index,setIndex]=useState(0),slides=content.slides;
 return <div className="region-gallery"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(slides.flatMap(slide=>slide.managed?[imageObject(slide.managed,{assetId:slide.assetId,alt:slide.alt,caption:slide.caption,decorative:false})]:[])).replace(/</g,'\\u003c')}}/><div className="region-gallery-track" style={{transform:`translateX(-${index*100}%)`}}>{slides.map((slide,i)=><figure key={slide.assetId+'-'+i} aria-hidden={i!==index}><img src={slide.url} srcSet={slide.managed?imageSrcSet(slide.managed):undefined} sizes="(max-width: 768px) 100vw, 960px" alt={slide.alt} width={slide.width||1440} height={slide.height||960} loading={priority&&i===0?'eager':'lazy'}/><figcaption><strong>{slide.caption}</strong><span>{slide.eventDate&&<time dateTime={slide.eventDate}>{slide.eventDate} · </time>}{slide.credit}{slide.sourceUrl&&<> · <a href={slide.sourceUrl} target="_blank" rel="noopener noreferrer" tabIndex={i===index?0:-1}>Source ↗</a></>}</span></figcaption></figure>)}</div>{slides.length>1&&<div className="region-gallery-controls"><button type="button" data-analytics-component="Regional Image Previous" aria-label="Previous regional image" onClick={()=>setIndex((index+slides.length-1)%slides.length)}>←</button><span aria-live="polite">{index+1} / {slides.length}</span><button type="button" data-analytics-component="Regional Image Next" aria-label="Next regional image" onClick={()=>setIndex((index+1)%slides.length)}>→</button></div>}</div>;
}
const RequestBuilder=dynamic(()=>import('./RegionalRequestBuilder'),{ssr:false});
export function RegionalRequestBuilder({city,group}:{city:string;group?:string}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const sync=()=>setVisible(document.documentElement.getAttribute('data-city-donation-request-visible')==='true');sync();window.addEventListener('bloodnet:ui-controls',sync);const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-city-donation-request-visible']});return()=>{window.removeEventListener('bloodnet:ui-controls',sync);observer.disconnect();};},[]);
 return visible?<RequestBuilder city={city} group={group}/>:null;
}
