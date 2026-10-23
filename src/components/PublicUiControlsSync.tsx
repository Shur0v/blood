"use client";
import {useEffect} from 'react';
import {applyPublicUiControls,UI_CONTROLS_STORAGE} from '@/src/lib/publicUiControls';
export default function PublicUiControlsSync(){useEffect(()=>{
  if(window.self!==window.top)return;
  const apply=(value:unknown)=>{if(!value||typeof value!=='object')return;applyPublicUiControls({ ...('discoveryVisible' in value&&typeof value.discoveryVisible==='boolean'?{discoveryVisible:value.discoveryVisible}:{}),...('patientIdVisible' in value&&typeof value.patientIdVisible==='boolean'?{patientIdVisible:value.patientIdVisible}:{}) });};
  const storage=(event:StorageEvent)=>{if(event.key===UI_CONTROLS_STORAGE&&event.newValue)try{apply(JSON.parse(event.newValue));}catch{}};
  window.addEventListener('storage',storage);
  const stream=typeof EventSource!=='undefined'?new EventSource('/api/public/ui-events'):null;
  if(stream)stream.onmessage=event=>{try{apply(JSON.parse(event.data));}catch{}};
  return()=>{stream?.close();window.removeEventListener('storage',storage);};
},[]);return null;}
