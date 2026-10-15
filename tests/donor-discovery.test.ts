import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverDonors } from '../src/lib/donorDiscovery';

test('discovery keeps local matches and existing blood filters without extra requests',async()=>{
  const calls:string[]=[];
  const fetcher=(async(input)=>{calls.push(String(input));return Response.json({success:true,data:[{id:'local'}]});}) as typeof fetch;
  const result=await discoverDonors('/api/public/donors',new URLSearchParams({country:'India',bloodGroup:'O-'}),undefined,fetcher);
  assert.equal(calls.length,1);assert.equal(result.notice,'');assert.equal(result.params.get('bloodGroup'),'O-');assert.equal(result.params.get('country'),'India');
});

test('empty city and country progressively broaden with truthful category labels and stable pagination',async()=>{
  const calls:URLSearchParams[]=[];
  const fetcher=(async(input)=>{calls.push(new URL(String(input),'http://localhost').searchParams);return Response.json({success:true,data:calls.length===4?[{id:'alternative',blood_group:'A+'}]:[],pagination:{nextCursor:'16'}});}) as typeof fetch;
  const result=await discoverDonors('/api/public/donors',new URLSearchParams({country:'Nepal',search:'Empty city',bloodGroup:'O-'}),undefined,fetcher);
  assert.equal(calls.length,4);assert.equal(calls[1].get('country'),'Nepal');assert.equal(calls[1].get('bloodGroup'),'O-');
  assert.equal(calls[2].has('country'),false);assert.equal(calls[2].get('bloodGroup'),'O-');assert.equal(calls[3].has('bloodGroup'),false);
  assert.match(result.notice,/do not match the selected filters/);assert.equal(result.params.get('sort'),'NEARBY');
  result.params.set('cursor','16');const count=calls.length;
  await discoverDonors('/api/public/donors',result.params,undefined,fetcher);
  assert.equal(calls.length,count+1,'Pagination must not restart broader searches');
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
