import {imageSitemap} from '@/src/backend/services/imageSitemap';
export const dynamic='force-dynamic';
export async function GET(){try{return new Response(await imageSitemap(),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=0, s-maxage=300'}});}catch{return new Response('Image sitemap temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});}}
