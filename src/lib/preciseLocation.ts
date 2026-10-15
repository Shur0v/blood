export type PreciseLocation = {country:string;city?:string;lat:number;lng:number};

// Called only by an explicit user action, never during page load.
export async function requestBrowserLocation(geolocation:Pick<Geolocation,'getCurrentPosition'>,fetcher:typeof fetch=fetch):Promise<PreciseLocation> {
  const position=await new Promise<GeolocationPosition>((resolve,reject)=>geolocation.getCurrentPosition(resolve,error=>reject(new Error(error.code===1?'Location permission was not granted. Automatic detection remains available.':'Your device could not determine its location. Automatic detection remains available.')),{enableHighAccuracy:true,timeout:10000,maximumAge:5*60*1000}));
  const lat=position.coords.latitude,lng=position.coords.longitude;
  if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180)throw new Error('Your device returned an invalid location.');
  const response=await fetcher(`/api/location/reverse?${new URLSearchParams({lat:String(lat),lng:String(lng)})}`,{cache:'no-store',signal:AbortSignal.timeout(6000)});
  const payload=await response.json();
  if(!response.ok||!payload.success||payload.meta?.fallback||typeof payload.data?.country!=='string'||!payload.data.country.trim())throw new Error('Could not confirm your country. Automatic detection remains available.');
  return {country:payload.data.country.trim(),city:typeof payload.data.city==='string'?payload.data.city:undefined,lat,lng};
}
