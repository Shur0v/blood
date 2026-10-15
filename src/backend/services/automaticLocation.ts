import { isIP } from 'node:net';

type Location={country:string;city?:string;lat?:number;lng?:number};
const cache=new Map<string,{expires:number;value:Promise<Location|null>}>();
export function publicClientIp(req:Request) {
  const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'').trim();
  if(!isIP(ip)||/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80|::ffff:)/i.test(ip))return null;
  return ip;
}
// Never omit ip: doing so would geolocate the VPS instead of the visitor.
export async function automaticIpLocation(req:Request):Promise<Location|null> {
  const ip=publicClientIp(req),key=process.env.GEOAPIFY_API_KEY;
  if(!ip||!key)return null;
  const saved=cache.get(ip);if(saved&&saved.expires>Date.now())return saved.value;
  if(cache.size>=1000)cache.delete(cache.keys().next().value!);
  const value=(async()=>{
    try {
      const url=new URL('https://api.geoapify.com/v1/ipinfo');url.searchParams.set('ip',ip);url.searchParams.set('apiKey',key);
      const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(3500)});
      if(!response.ok)return null;
      const data=await response.json();const country=data.country?.name;
      if(typeof country!=='string'||!country.trim())return null;
      const lat=data.location?.latitude,lng=data.location?.longitude;
      return {country:country.trim(),...(typeof data.city?.name==='string'?{city:data.city.name}:{}),
        ...(Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lng)&&Math.abs(lng)<=180?{lat,lng}:{})};
    } catch {return null;}
  })();
  cache.set(ip,{expires:Date.now()+10*60*1000,value});return value;
}
