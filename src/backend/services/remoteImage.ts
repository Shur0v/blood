import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {isIP,BlockList} from 'node:net';
import {MedicalError} from '../utils/medicalPrivacy';

const blocked=new BlockList();
for(const [base,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]] as const)blocked.addSubnet(base,prefix,'ipv4');
// Only global unicast IPv6 destinations are accepted; transition/local/documentation ranges are rejected.
const globalV6=new BlockList();globalV6.addSubnet('2000::',3,'ipv6');
for(const [base,prefix] of [['2001::',23],['2001:db8::',32],['2002::',16],['3fff::',20]] as const)blocked.addSubnet(base,prefix,'ipv6');
export function isPublicImageAddress(address:string){const family=isIP(address);return family===4?!blocked.check(address,'ipv4'):family===6&&globalV6.check(address,'ipv6')&&!blocked.check(address,'ipv6');}
export function validateRemoteImageUrl(value:string){
 let url:URL;try{url=new URL(value);}catch{throw new MedicalError('Use a valid HTTPS image URL.',400);}
 if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||url.hash||url.hostname.toLowerCase()==='localhost')throw new MedicalError('Use a public HTTPS image URL without credentials.',400);
 return url;
}
export async function downloadPublicImage(value:string):Promise<Buffer>{
 const deadline=Date.now()+10_000;
 async function fetchImage(url:URL,redirects:number):Promise<Buffer>{
  const hostname=url.hostname.replace(/^\[|\]$/g,''),remaining=deadline-Date.now();
  if(remaining<=0)throw new MedicalError('Image download timed out.',400);
  const addresses=await Promise.race([lookup(hostname,{all:true,verbatim:true}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(new MedicalError('Image DNS lookup timed out.',400)),remaining);timer.unref();})]);
  if(!addresses.length||addresses.some(item=>!isPublicImageAddress(item.address)))throw new MedicalError('Only public image hosts are allowed.',400);
  const pinned=addresses[0];
  const response=await new Promise<import('node:http').IncomingMessage>((resolve,reject)=>{
   const req=request(url,{method:'GET',agent:false,headers:{Accept:'image/jpeg,image/png,image/webp','User-Agent':'BloodNet-PublicImageImport/1.0'},lookup:((_host:unknown,options:{all?:boolean},callback:Function)=>options?.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family)) as any},resolve);
   const timer=setTimeout(()=>req.destroy(new MedicalError('Image download timed out.',400)),Math.max(1,deadline-Date.now()));timer.unref();req.once('error',reject);req.once('response',res=>{res.once('close',()=>clearTimeout(timer));});req.end();
  });
  if([301,302,303,307,308].includes(response.statusCode||0)){const next=response.headers.location;response.destroy();if(!next||redirects>=3)throw new MedicalError('Image redirected too many times.',400);return fetchImage(validateRemoteImageUrl(new URL(next,url).href),redirects+1);}
  if(response.statusCode!==200){response.destroy();throw new MedicalError('The image could not be downloaded.',400);}
  if(!/^image\/(jpeg|png|webp)(;|$)/i.test(response.headers['content-type']||'')){response.destroy();throw new MedicalError('Use a JPEG, PNG or WebP image.',400);}
  const max=10*1024*1024;if(Number(response.headers['content-length'])>max){response.destroy();throw new MedicalError('Image exceeds 10 MB.',400);}
  const chunks:Buffer[]=[];let size=0;for await(const chunk of response){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>max){response.destroy();throw new MedicalError('Image exceeds 10 MB.',400);}chunks.push(bytes);}
  return Buffer.concat(chunks);
 }
 return fetchImage(validateRemoteImageUrl(value),0);
}
