import {NextResponse} from 'next/server';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {privateHeaders,MedicalError} from '@/src/backend/utils/medicalPrivacy';
import {boundedBody} from '@/src/backend/utils/boundedBody';
import {securityJson,securityRateLimit} from '@/src/backend/utils/security';
import {getIpHash} from '@/src/backend/utils/risk';
import {createPublicImage,listManagedImages,withPublicImageWork,updatePublicImage} from '@/src/backend/services/publicImages';
import {downloadPublicImage} from '@/src/backend/services/remoteImage';
export const runtime='nodejs';
export const GET=withActiveAdmin(async(req:Request)=>{const cursor=new URL(req.url).searchParams.get('cursor')||undefined;if(cursor&&!/^[0-9a-f-]{36}$/i.test(cursor))throw new MedicalError('Invalid library cursor.',400);const result=await listManagedImages(cursor);return NextResponse.json({success:true,data:result.images,pagination:{nextCursor:result.nextCursor}},{headers:privateHeaders});});
export const PATCH=withActiveAdmin(async(req:Request)=>{const input=await securityJson(req);if(typeof input?.id!=='string'||!/^[0-9a-f-]{36}$/i.test(input.id))throw new MedicalError('Choose a public image.',400);return NextResponse.json({success:true,data:await updatePublicImage(input.id,input.metadata)},{headers:privateHeaders});});
export const POST=withActiveAdmin(async(req:Request)=>withPublicImageWork(async()=>{
 await securityRateLimit('public-image-import',getIpHash(req),30,3600_000);
 let bytes:Buffer,metadata:unknown;
 if(req.headers.get('content-type')?.startsWith('multipart/form-data')){
  const raw=await boundedBody(req,10*1024*1024+128*1024),form=await new Response(raw as BodyInit,{headers:{'Content-Type':req.headers.get('content-type')!}}).formData(),file=form.get('file');
  if(!(file instanceof File))throw new MedicalError('Choose an image to upload.',400);
  try{metadata=JSON.parse(String(form.get('metadata')));}catch{throw new MedicalError('Add image information.',400);}
  bytes=Buffer.from(await file.arrayBuffer());
 }else{const input=await securityJson(req);const {PublicImageMetadataSchema}=await import('@/src/lib/publicImages');const parsed=PublicImageMetadataSchema.safeParse(input?.metadata);if(!parsed.success)throw new MedicalError('Confirm reuse permission and add image information.',400);metadata=parsed.data;if(typeof input?.url!=='string'||input.url.length>2048)throw new MedicalError('Use a valid image URL.',400);bytes=await downloadPublicImage(input.url);}
 return NextResponse.json({success:true,data:await createPublicImage(bytes,metadata)},{status:201,headers:privateHeaders});
}));
