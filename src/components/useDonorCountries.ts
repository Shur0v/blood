"use client";
import {useEffect,useState} from 'react';
type Coverage={countries:string[];loaded:boolean;failed:boolean};
let state:Coverage={countries:[],loaded:false,failed:false},updated=0,pending:Promise<void>|undefined;
const listeners=new Set<()=>void>();
async function refresh(){
  if(pending)return pending;if(Date.now()-updated<15000)return;
  pending=(async()=>{try{
    const response=await fetch('/api/public/donor-countries',{cache:'no-store',signal:AbortSignal.timeout(8000)});
    const payload=await response.json();if(!response.ok||!payload.success||!Array.isArray(payload.data))throw Error('Coverage unavailable');
    state={countries:payload.data.filter((name:unknown)=>typeof name==='string'&&name.trim()),loaded:true,failed:false};updated=Date.now();
  }catch{state={...state,failed:true};}finally{pending=undefined;listeners.forEach(sync=>sync());}})();return pending;
}
export default function useDonorCountries(){
  const [coverage,setCoverage]=useState<Coverage>({countries:[],loaded:false,failed:false});
  useEffect(()=>{const sync=()=>setCoverage(state);listeners.add(sync);sync();void refresh();
    const refreshVisible=()=>{if(document.visibilityState!=='hidden')void refresh();};
    window.addEventListener('focus',refreshVisible);document.addEventListener('visibilitychange',refreshVisible);
    const timer=setInterval(refreshVisible,60000);
    return()=>{listeners.delete(sync);clearInterval(timer);window.removeEventListener('focus',refreshVisible);document.removeEventListener('visibilitychange',refreshVisible);};
  },[]);return coverage;
}
