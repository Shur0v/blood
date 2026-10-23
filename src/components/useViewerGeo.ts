import { useEffect, useState } from "react";
import { requestBrowserLocation } from '../lib/preciseLocation';

interface ViewerGeo {
  city?: string;
  lat?: number;
  lng?: number;
  resolved?: boolean;
  country?: string;
  source?: "gps" | "ip" | "timezone" | "locale";
  updatedAt?: number;
}

const TIMEZONE_COUNTRY_MAP: Array<{ zone: string; country: string }> = [
  { zone: "Asia/Dhaka", country: "Bangladesh" },
  { zone: "Asia/Dacca", country: "Bangladesh" },
  { zone: "Asia/Kolkata", country: "India" },
  { zone: "Asia/Calcutta", country: "India" },
  { zone: "Asia/Singapore", country: "Singapore" },
  { zone: "Asia/Manila", country: "Philippines" },
  { zone: "Europe/London", country: "United Kingdom" },
  { zone: "America/New_York", country: "United States" },
  { zone: "America/Chicago", country: "United States" },
  { zone: "America/Denver", country: "United States" },
  { zone: "America/Los_Angeles", country: "United States" },
  { zone: "America/Toronto", country: "Canada" },
  { zone: "Australia/Sydney", country: "Australia" },
  { zone: "Australia/Melbourne", country: "Australia" },
];

const deriveCountryFromTimezone = (): string | undefined => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return undefined;

    const exact = TIMEZONE_COUNTRY_MAP.find((item) => item.zone === zone);
    if (exact) return exact.country;

    if (zone.startsWith("Asia/")) {
      if (zone.includes("Karachi")) return "Pakistan";
      if (zone.includes("Kathmandu")) return "Nepal";
    }
    if (zone.startsWith("Europe/")) {
      if (zone.includes("Berlin")) return "Germany";
      if (zone.includes("Paris")) return "France";
      if (zone.includes("Madrid")) return "Spain";
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const deriveCountryFromLocale = (): string | undefined => {
  try {
    const locale = navigator.language || "";
    const parts = locale.split("-");
    const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
    if (!region || region.length !== 2) return undefined;
    return new Intl.DisplayNames(["en"], { type: "region" }).of(region) || undefined;
  } catch {
    return undefined;
  }
};

let pending: Promise<ViewerGeo> | undefined;
let recent: ViewerGeo | undefined;
let precisePending: Promise<ViewerGeo> | undefined;
let cityPending:Promise<void>|undefined;
let cityAttempt=0;
const GEO_EVENT='bloodnet-viewer-geo';
const TTL=10*60*1000;
async function automaticLocation(): Promise<ViewerGeo> {
  if(recent?.updatedAt&&Date.now()-recent.updatedAt<TTL)return recent;
  if(pending)return pending;
  pending=(async()=>{
    const started=Date.now();
    try {
      const response=await fetch('/api/location/ip',{cache:'no-store',signal:AbortSignal.timeout(5000)});
      const payload=await response.json();
      if(response.ok&&payload.success&&payload.data?.country) {
        if(recent?.source==='gps'&&recent.updatedAt!>=started)return recent;
        return recent={...payload.data,source:'ip',resolved:true,updatedAt:Date.now()};
      }
    } catch { /* Use an approximate, permission-free fallback. */ }
    if(recent?.source==='gps'&&recent.updatedAt!>=started)return recent;
    const timezone=deriveCountryFromTimezone(),locale=deriveCountryFromLocale();
    return recent={country:timezone||locale,source:timezone?'timezone':'locale',resolved:true,updatedAt:Date.now()};
  })().finally(()=>{pending=undefined;});
  return pending;
}

async function enrichCity(){
  if(cityPending)return cityPending;
  if(!recent?.country||recent.city||recent.source==='gps'||Date.now()-cityAttempt<TTL)return;
  cityAttempt=Date.now();
  cityPending=(async()=>{try{
    const response=await fetch('/api/location/ip?detail=city',{cache:'no-store',signal:AbortSignal.timeout(5000)});
    const payload=await response.json(),data=payload.data;
    if(!response.ok||!payload.success||!data?.city||!data.country||recent?.source==='gps')return;
    if(recent?.source==='ip'&&recent.country!==data.country)return;
    recent={...data,source:'ip',resolved:true,updatedAt:Date.now()};
    window.dispatchEvent(new Event(GEO_EVENT));
  }catch{/* Country browsing remains available if city detection fails. */}
  finally{cityPending=undefined;}})();return cityPending;
}

// Automatic browsing is permission-free; GPS is available only on request.
export default function useViewerGeo() {
  const [geo,setGeo]=useState<ViewerGeo>({});
  const [locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState('');
  useEffect(()=>{
    let cancelled=false;
    const changed=()=>{if(recent&&!cancelled)setGeo(recent);};
    window.addEventListener(GEO_EVENT,changed);
    void automaticLocation().then(value=>{if(!cancelled){setGeo(recent?.source==='gps'?recent:value);void enrichCity();}});
    return()=>{cancelled=true;window.removeEventListener(GEO_EVENT,changed);};
  },[]);
  const requestPreciseLocation=async()=>{
    setLocating(true);setLocationMessage('');
    try {
      if(!navigator.geolocation)throw new Error('Browser location is unavailable. You can choose your country instead.');
      if(!precisePending)precisePending=requestBrowserLocation(navigator.geolocation).then(location=>{
        recent={...location,source:'gps',resolved:true,updatedAt:Date.now()};
        window.dispatchEvent(new Event(GEO_EVENT));return recent;
      }).finally(()=>{precisePending=undefined;});
      const confirmed=await precisePending;
      setLocationMessage(`Browser location confirmed: ${[confirmed.city,confirmed.country].filter(Boolean).join(', ')}.`);
      return confirmed;
    }catch(error){setLocationMessage(error instanceof Error?error.message:'Location could not be confirmed. Automatic detection remains available.');return null;}
    finally{setLocating(false);}
  };
  return {...geo,requestPreciseLocation,locating,locationMessage};
}
