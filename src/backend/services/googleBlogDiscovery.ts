import {createSign} from 'node:crypto';

export async function notifyGoogleBlogs(baseUrl:string,propertyName:string|undefined,credentials:{type:string;client_email:string;private_key:string},request:typeof fetch=fetch) {
  const base=new URL(baseUrl);
  if(base.protocol!=='https:')throw new Error('Google submission requires the public HTTPS origin.');
  const property=propertyName||`sc-domain:${base.hostname}`;
  if(property!==`sc-domain:${base.hostname}`&&property!==`${base.origin}/`)throw new Error('Search Console property must match the public site origin or domain.');
  if(!credentials||credentials.type!=='service_account'||typeof credentials.client_email!=='string'||typeof credentials.private_key!=='string')throw new Error('Invalid service-account credentials.');
  const now=Math.floor(Date.now()/1000);
  const encode=(data:unknown)=>Buffer.from(JSON.stringify(data)).toString('base64url');
  const unsigned=`${encode({alg:'RS256',typ:'JWT'})}.${encode({iss:credentials.client_email,scope:'https://www.googleapis.com/auth/webmasters',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+300})}`;
  const signature=createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key,'base64url');
  const tokenResponse=await request('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`}),signal:AbortSignal.timeout(15000)});
  if(!tokenResponse.ok)throw new Error(`Google authentication failed (HTTP ${tokenResponse.status}). Check the service account configuration.`);
  const token=await tokenResponse.json();
  if(typeof token.access_token!=='string')throw new Error('Google did not provide an access token.');
  const submitted:string[]=[];
  for(const path of ['/sitemap-blog.xml','/blog/feed.xml']) {
    const sitemap=base.origin+path;
    const result=await request(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemap)}`,{method:'PUT',headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(15000)});
    if(!result.ok)throw new Error(`Google sitemap submission failed (HTTP ${result.status}). Ensure Search Console API is enabled and the service account has property access.`);
    submitted.push(sitemap);
  }
  return submitted;
}
