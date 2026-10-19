import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverDonors } from '../src/lib/donorDiscovery';
import { requestBrowserLocation } from '../src/lib/preciseLocation';
import { GET as reverseLocation } from '../src/app/api/location/reverse/route';

test('discovery keeps local matches and existing blood filters without extra requests',async()=>{
  const calls:string[]=[];
  const fetcher=(async(input)=>{calls.push(String(input));return Response.json({success:true,data:[{id:'local'}]});}) as typeof fetch;
  const result=await discoverDonors('/api/public/donors',new URLSearchParams({country:'India',bloodGroup:'O-'}),undefined,fetcher);
  assert.equal(calls.length,1);assert.equal(result.notice,'');assert.equal(result.params.get('bloodGroup'),'O-');assert.equal(result.params.get('country'),'India');
});

test('explicit empty searches keep country and category filters without silent alternatives',async()=>{
 const calls:URLSearchParams[]=[];const fetcher=(async(input)=>{calls.push(new URL(String(input),'http://localhost').searchParams);return Response.json({success:true,data:[],pagination:{nextCursor:null}});}) as typeof fetch;
 const result=await discoverDonors('/api/public/donors',new URLSearchParams({country:'Nepal',search:'Empty city',bloodGroup:'O-'}),undefined,fetcher);
 assert.equal(calls.length,1);assert.equal(result.params.get('country'),'Nepal');assert.equal(result.params.get('bloodGroup'),'O-');assert.equal(result.params.get('search'),'Empty city');assert.match(result.notice,/have not been removed/);
 result.params.set('cursor','16');await discoverDonors('/api/public/donors',result.params,undefined,fetcher);assert.equal(calls.length,2);
});

test('network errors never silently broaden filters or fabricate donor data',async()=>{
  let calls=0;
  const fetcher=(async()=>{calls++;return Response.json({success:false,message:'Offline'},{status:503});}) as typeof fetch;
  await assert.rejects(()=>discoverDonors('/api/public/donors',new URLSearchParams({country:'India'}),undefined,fetcher),/Offline/);
  assert.equal(calls,1);
});

test('automatic city discovery tries the detected city before broadening within the country',async()=>{
  const queries:URLSearchParams[]=[];
  const fetcher=(async(input)=>{queries.push(new URL(String(input),'http://localhost').searchParams);return Response.json({success:true,data:queries.length===1?[]:[{id:'next-city'}]});}) as typeof fetch;
  const result=await discoverDonors('/api/public/donors',new URLSearchParams({country:'India',viewerCity:'Delhi',bloodGroup:'A+'}),undefined,fetcher);
  assert.equal(queries[0].get('search'),'Delhi');assert.equal(queries[1].get('search'),null);assert.equal(result.params.get('country'),'India');assert.equal(result.params.get('bloodGroup'),'A+');assert.match(result.notice,/other available listings in India/);
});

test('explicit browser location uses high accuracy and confirmed reverse-geocoded country',async()=>{
  let options:PositionOptions|undefined;
  const browser={getCurrentPosition(success:PositionCallback,_error?:PositionErrorCallback|null,settings?:PositionOptions){options=settings;success({coords:{latitude:23.81,longitude:90.41}} as GeolocationPosition);}};
  const fetcher=(async(input)=>{const url=new URL(String(input),'http://localhost');assert.equal(url.pathname,'/api/location/reverse');assert.equal(url.searchParams.get('lat'),'23.81');return Response.json({success:true,data:{country:'Bangladesh',city:'Dhaka'}});}) as typeof fetch;
  assert.deepEqual(await requestBrowserLocation(browser,fetcher),{country:'Bangladesh',city:'Dhaka',lat:23.81,lng:90.41});
  assert.equal(options?.enableHighAccuracy,true);assert.equal(options?.timeout,10000);
});

test('denied browser location keeps automatic detection and makes no reverse request',async()=>{
  let calls=0;
  const browser={getCurrentPosition(_success:PositionCallback,error?:PositionErrorCallback|null){error?.({code:1} as GeolocationPositionError);}};
  const fetcher=(async()=>{calls++;return Response.json({});}) as typeof fetch;
  await assert.rejects(()=>requestBrowserLocation(browser,fetcher),/Automatic detection remains available/);assert.equal(calls,0);
});

test('a rough reverse-location fallback cannot be presented as a confirmed browser country',async()=>{
  const browser={getCurrentPosition(success:PositionCallback){success({coords:{latitude:48,longitude:2}} as GeolocationPosition);}};
  const fetcher=(async()=>Response.json({success:true,data:{country:'Bangladesh',city:'Dhaka'},meta:{fallback:true}})) as typeof fetch;
  await assert.rejects(()=>requestBrowserLocation(browser,fetcher),/Could not confirm your country/);
});

test('an incomplete reverse-provider response cannot invent a country from the sample city list',async()=>{
  const savedFetch=globalThis.fetch,savedKey=process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY='synthetic-test-only';
  globalThis.fetch=(async()=>Response.json({results:[]})) as typeof fetch;
  try {assert.equal((await reverseLocation(new Request('http://localhost/api/location/reverse?lat=48&lng=2'))).status,502);}
  finally{globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.GEOAPIFY_API_KEY;else process.env.GEOAPIFY_API_KEY=savedKey;}
});
