'use client';
import {useEffect,useState,useRef} from 'react';
import dynamic from 'next/dynamic';
const AuthModal=dynamic(()=>import('../AuthModal'),{ssr:false});
function recordAction(component:'USA Registration Start'|'USA Account Access Completed'){const page=location.pathname;if(!/^\/us(?:\/|$)/.test(page)||page.includes('/preview/'))return;void fetch('/api/analytics/clicks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:[{page,component,deviceType:innerWidth<700?'mobile':innerWidth<1100?'tablet':'desktop'}]})}).catch(()=>{});}
export default function UsaActions({label='Register as a donor',login=false}:{label?:string;login?:boolean}){
 const epoch=useRef(0);
 const [mode,setMode]=useState<'login'|'register'|null>(null),[signedIn,setSignedIn]=useState(false);
 useEffect(()=>{const controller=new AbortController(),version=++epoch.current;fetch('/api/auth/session',{cache:'no-store',credentials:'include',signal:controller.signal}).then(r=>r.ok?r.json():null).then(body=>{if(!controller.signal.aborted&&version===epoch.current)setSignedIn(Boolean(body?.user));}).catch(()=>{});return()=>controller.abort();},[]);
 return <><div className="us-actions">{signedIn?<a href="/?profile=1" className="us-button">Manage your profile ↗</a>:<><button className="us-button" data-analytics-component="USA Registration Invitation" onClick={()=>{recordAction('USA Registration Start');setMode('register');}}>{label}<span aria-hidden="true">↗</span></button>{login&&<button className="us-button secondary" data-analytics-component="USA Login" onClick={()=>setMode('login')}>Log in</button>}</>}</div>{mode&&<AuthModal initialMode={mode} isOpen onClose={()=>setMode(null)} onSuccess={()=>{recordAction('USA Account Access Completed');epoch.current++;setMode(null);setSignedIn(true);window.dispatchEvent(new Event('bloodnet:session-changed'));}}/>}</>;
}
