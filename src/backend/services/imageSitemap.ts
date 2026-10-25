import {getHomepageContent} from './homepageContent';
import {getPrisma} from '../config/db';
import {getPublicBaseUrl} from '../config/env';
import {getDonorLocations,donorLocationPath} from './donorLocations';
import {getRegionalEdition} from '@/src/lib/regionalEdition';
import {toLocationSlug} from '../utils/locationSlug';
import {PublicImagePlacementSchema} from '@/src/lib/publicImages';
import {publicBlogUrl} from '@/src/lib/blogDiscovery';
import {REGIONS} from '@/src/lib/regions';
const escape=(value:string)=>value.replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));
export async function imageSitemap(){
 const db=getPrisma(),base=getPublicBaseUrl();
 const [slides,blogs,regions,locations]=await Promise.all([db.homepageSlider.findMany({where:{status:'ACTIVE'}}),db.blog.findMany({where:{status:'PUBLISHED',slug:{not:null}},select:{slug:true,canonical_url:true,public_image:true}}),db.regionalPageContent.findMany({where:{published:true}}),getDonorLocations()]);
 const homepage=await getHomepageContent();
 const pages=new Map<string,Set<string>>(),ids=new Map<string,Set<string>>();
 const bind=(page:string,id:string)=>{const list=ids.get(page)||new Set<string>();list.add(id);ids.set(page,list);};
 for(const row of homepage?.hiddenSections.includes('slider')?[]:slides){const image=PublicImagePlacementSchema.safeParse(row.public_image);if(image.success&&!image.data.decorative)bind(base+'/',image.data.assetId);else if(!image.success){try{const url=new URL(row.image_url,base);if(['http:','https:'].includes(url.protocol)&&!/^\/(api|private|uploads\/(verification|profile|medical_aid))(\/|$)/i.test(url.pathname)&&![...url.searchParams.keys()].some(key=>/token|secret|signature|credential/i.test(key))){const set=pages.get(base+'/')||new Set<string>();set.add(url.href);pages.set(base+'/',set);}}catch{}}}
 for(const row of blogs){const page=publicBlogUrl(row,base),image=PublicImagePlacementSchema.safeParse(row.public_image);if(page&&image.success&&!image.data.decorative)bind(page,image.data.assetId);}
 function slidesFor(country:string,city?:string){return regions.find(row=>row.key===toLocationSlug(country)+':'+toLocationSlug(city||''))||regions.find(row=>row.key===toLocationSlug(country)+':*');}
 function regional(page:string,row:typeof regions[number]|undefined){const design=row?.design as {hiddenSections?:string[]}|undefined;if(design?.hiddenSections?.includes('gallery'))return;if(row&&Array.isArray(row.slides))for(const value of row.slides){if(value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.assetId==='string')bind(page,value.assetId);}}
 for(const row of locations.filter(row=>row.bloodCount>0)){const record=slidesFor(row.country,row.city);regional(base+donorLocationPath(row,'blood'),record);for(const group of row.bloodGroups){const {bloodGroupToSlug}=await import('@/src/lib/seoRouting');const slug=bloodGroupToSlug(group);if(slug)regional(base+donorLocationPath(row,'blood')+'/'+slug,record);}}
 for(const country of [...new Set(locations.filter(row=>row.bloodCount>0).map(row=>row.country))])if(REGIONS.some(region=>region.country===country))regional(base+getRegionalEdition(country).countryPath,slidesFor(country));
 const assets=await db.mediaAsset.findMany({where:{id:{in:[...new Set([...ids.values()].flatMap(set=>[...set]))]},category:{in:['SLIDER','BLOG']},mime_type:'image/webp'},select:{id:true,public_url:true}});
 for(const [page,values] of ids){const set=pages.get(page)||new Set<string>();for(const id of values){const asset=assets.find(row=>row.id===id);if(asset)set.add(new URL(asset.public_url,base).href);}if(set.size)pages.set(page,set);}
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[...pages].map(([page,images])=>`<url><loc>${escape(page)}</loc>${[...images].slice(0,1000).map(url=>`<image:image><image:loc>${escape(url)}</image:loc></image:image>`).join('')}</url>`).join('')}</urlset>`;
}
