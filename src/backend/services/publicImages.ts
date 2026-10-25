import {markHomepagePublication} from './homepageContent';
import {cache} from 'react';
import sharp,{type Metadata} from 'sharp';
import {Prisma} from '@prisma/client';
import {getPrisma} from '../config/db';
import {saveOptimizedWebp} from './mediaStorage';
import {MedicalError} from '../utils/medicalPrivacy';
import {PublicImageMetadataSchema,PublicImagePlacementSchema,imageFilename,type ManagedImage} from '@/src/lib/publicImages';

export async function createPublicImage(bytes:Buffer,metadata:unknown){
 const parsed=PublicImageMetadataSchema.safeParse(metadata);if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid image information.',400);
 if(bytes.length>10*1024*1024)throw new MedicalError('Image exceeds 10 MB.',400);
 let original:Metadata;try{original=await sharp(bytes,{limitInputPixels:40_000_000,pages:1}).metadata();}catch{throw new MedicalError('Invalid or oversized image.',400);}
 if(!original.width||!original.height||!['jpeg','png','webp'].includes(original.format||'')||(original.pages||1)>1)throw new MedicalError('Use a still JPEG, PNG or WebP image.',400);
 const rotated=await sharp(bytes,{limitInputPixels:40_000_000,pages:1}).rotate().toBuffer(),dimensions=await sharp(rotated).metadata(),width=Math.min(dimensions.width!,1920);
 const widths=[...new Set([...[320,640,960,1440,1920].filter(size=>size<width),width])];
 const variants=[];
 for(const size of widths){const output=await sharp(rotated).resize({width:size,withoutEnlargement:true}).webp({quality:85}).toBuffer(),info=await sharp(output).metadata();const stored=await saveOptimizedWebp({category:'SLIDER',optimizedBuffer:output,descriptiveName:imageFilename(parsed.data.filename)});variants.push({url:stored.publicUrl,width:info.width!,height:info.height!,storageKey:stored.storageKey,size:output.length});}
 const largest=variants.at(-1)!;
 const asset=await getPrisma().mediaAsset.create({data:{category:'SLIDER',storage_key:largest.storageKey,public_url:largest.url,mime_type:'image/webp',width:largest.width,height:largest.height,size_bytes:largest.size,public_metadata:parsed.data,variants}});
 return managedImage(asset)!;
}
function managedImage(asset:{id:string;category:string;public_metadata:unknown;variants:unknown;public_url:string;width:number|null;height:number|null;mime_type:string}):ManagedImage|null{
 const metadata=PublicImageMetadataSchema.safeParse(asset.public_metadata);if(!metadata.success||!['BLOG','SLIDER'].includes(asset.category)||asset.mime_type!=='image/webp')return null;
 const variants=Array.isArray(asset.variants)?asset.variants.flatMap((item:any)=>item&&typeof item.url==='string'&&typeof item.width==='number'&&typeof item.height==='number'?[{url:item.url,width:item.width,height:item.height}] :[]):[];
 return {id:asset.id,url:asset.public_url,width:asset.width||1920,height:asset.height||1280,metadata:metadata.data,variants};
}
export const getManagedImage=cache(async(id:string):Promise<ManagedImage|null>=>{const asset=await getPrisma().mediaAsset.findUnique({where:{id}});return asset?managedImage(asset):null;});
export async function listManagedImages(cursor?:string){const rows=await getPrisma().mediaAsset.findMany({where:{category:{in:['BLOG','SLIDER']},public_metadata:{not:Prisma.DbNull}},orderBy:[{created_at:'desc'},{id:'desc'}],...(cursor?{cursor:{id:cursor},skip:1}:{}),take:51});return {images:rows.slice(0,50).flatMap(row=>{const image=managedImage(row);return image?[image]:[];}),nextCursor:rows.length>50?rows[49].id:null};}

export async function validateImagePlacement(input:unknown){const parsed=PublicImagePlacementSchema.safeParse(input);if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid image placement.',400);if(!await getManagedImage(parsed.data.assetId))throw new MedicalError('Choose a managed public image.',400);return parsed.data;}
export async function updatePublicImage(id:string,input:unknown){
 const metadata=PublicImageMetadataSchema.safeParse(input);if(!metadata.success)throw new MedicalError('Confirm rights and use valid image information.',400);if(!await getManagedImage(id))throw new MedicalError('Public image not found.',404);
 return getPrisma().$transaction(async tx=>{const row=await tx.mediaAsset.findUniqueOrThrow({where:{id}});if(JSON.stringify(row.public_metadata,Object.keys(metadata.data).sort())!==JSON.stringify(metadata.data,Object.keys(metadata.data).sort())){
  await tx.mediaAsset.update({where:{id},data:{public_metadata:metadata.data}});
  const now=new Date();const activeSlides=await tx.homepageSlider.updateMany({where:{status:'ACTIVE',public_image:{path:['assetId'],equals:id}},data:{updated_at:now}});await tx.blog.updateMany({where:{status:'PUBLISHED',public_image:{path:['assetId'],equals:id}},data:{updated_at:now}});await tx.regionalPageContent.updateMany({where:{published:true,slides:{array_contains:[{assetId:id}]}},data:{public_updated_at:now}});if(activeSlides.count)await markHomepagePublication(tx);
 }return managedImage({...row,public_metadata:metadata.data})!;});
}


let activeImageWork=0;
export async function withPublicImageWork<T>(work:()=>Promise<T>):Promise<T>{if(activeImageWork>=2)throw new MedicalError('Two images are processing. Try again shortly.',429);activeImageWork++;try{return await work();}finally{activeImageWork--;}}
