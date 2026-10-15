export function isAllowedWriteRequest(req:Request,configuredOrigin?:string):boolean {
  if(['GET','HEAD','OPTIONS'].includes(req.method))return true;
  if(new URL(req.url).pathname.startsWith('/api/integrations/')&&req.headers.get('authorization')?.startsWith('Bearer '))return true;
  if(req.headers.get('sec-fetch-site')==='cross-site')return false;
  const trusted=new Set([new URL(req.url).origin]);
  for(const value of [configuredOrigin]) {
    try{if(value)trusted.add(new URL(value).origin);}catch{/* Invalid configuration cannot add a trusted origin. */}
  }
  const origin=req.headers.get('origin');
  if(origin)return trusted.has(origin);
  const referer=req.headers.get('referer');
  if(referer){try{return trusted.has(new URL(referer).origin);}catch{return false;}}
  // Non-browser server integrations may omit both; browsers send fetch metadata.
  return true;
}
