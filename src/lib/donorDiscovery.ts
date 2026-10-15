// Broaden only after a successful empty response, never on errors. Persist the
// effective query for pagination so later pages cannot jump back to local mode.
export async function discoverDonors(endpoint:string, original:URLSearchParams, signal?:AbortSignal, fetcher:typeof fetch=fetch) {
  const params=new URLSearchParams(original);
  if(!params.has('cursor')&&!params.has('search')&&params.get('viewerCity')&&params.get('country'))params.set('search',params.get('viewerCity')!);
  const countryKey=endpoint.endsWith('organ-requests')?'viewerCountry':'country';
  const country=params.get(countryKey),search=params.get('search');
  let notice='';
  const read=async()=>{
    const response=await fetcher(`${endpoint}?${params}`,{method:'GET',cache:'no-store',signal});
    const payload=await response.json();
    if(!response.ok||!payload.success)throw new Error(payload.message||'Unable to load donors.');
    signal?.throwIfAborted();return payload;
  };
  let payload=await read();
  if(params.has('cursor'))return {payload,params,notice};
  if(!payload.data?.length&&search) {
    params.delete('search');params.set('sort','NEARBY');
    notice=`No exact matches for “${search}”. Showing other available listings${country?` in ${country}`:''}.`;
    payload=await read();
  }
  if(!payload.data?.length&&country) {
    params.delete(countryKey);params.set('sort','NEARBY');
    notice=`No matching listings in ${country}. Showing available donors from other locations, with nearby results first where location data is available.`;
    payload=await read();
  }
  if(!payload.data?.length&&(params.has('bloodGroup')||params.has('organ'))) {
    const requested=[params.get('bloodGroup'),params.get('organ')].filter(Boolean).join(' / ');
    params.delete('bloodGroup');params.delete('organ');params.set('sort','NEARBY');
    notice=`No available listings for ${requested}. These are other donation categories; they do not match the selected filters.`;
    payload=await read();
  }
  if(!country&&!notice)notice='Showing available donor listings. Choose your country for local results.';
  return {payload,params,notice};
}
