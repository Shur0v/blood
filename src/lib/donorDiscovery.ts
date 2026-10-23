import {discoverySnapshot,publishDiscoverySnapshot} from './discoveryState';
// Strict callers retain their location constraints. Donor browse surfaces opt
// into local-first expansion; explicit text and category filters stay intact.
export async function discoverDonors(endpoint:string, original:URLSearchParams, signal?:AbortSignal, fetcher:typeof fetch=fetch,options:{report?:boolean}={}) {
  const params=new URLSearchParams(original);
  const inferredCity=!params.has('expand')&&!params.has('cursor')&&!params.has('search')&&params.get('viewerCity')&&params.get('country');
  if(inferredCity)params.set('search',params.get('viewerCity')!);
  let notice=params.get('expand')==='nearby'?'Local donors appear first, followed by nearby cities and countries. Blood group and organ filters stay selected. Distances are approximate.':'';
  const read=async()=>{const requestSignal=signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000);const response=await fetcher(endpoint+'?'+params,{method:'GET',cache:'no-store',signal:requestSignal});const payload=await response.json();if(!response.ok||!payload.success)throw new Error(payload.message||'Unable to load donors.');signal?.throwIfAborted();return payload;};
  let payload=await read();
  if(!params.has('cursor')&&!payload.data?.length&&inferredCity){params.delete('search');params.set('sort','NEARBY');notice='No matching entries in the detected city. Showing other available listings in '+params.get('country')+' with the selected filters unchanged.';payload=await read();}
  if(!payload.data?.length)notice='No matching entries for your selected location and filters. Open Explore your community to browse other recorded locations. Donation-category filters have not been removed.';
  if(!params.has('cursor')&&options.report!==false)publishDiscoverySnapshot(discoverySnapshot(endpoint,params,payload.data?.length||0));
  return {payload,params,notice};
}
