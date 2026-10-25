import {NextResponse} from 'next/server';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {securityJson} from '@/src/backend/utils/security';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {getPrisma} from '@/src/backend/config/db';
import {getDonorLocations} from '@/src/backend/services/donorLocations';
import {saveRegionalContent} from '@/src/backend/services/regionalContent';
export const GET=withActiveAdmin(async()=>{
 const [records,locations]=await Promise.all([getPrisma().regionalPageContent.findMany({orderBy:{updated_at:'desc'}}),getDonorLocations()]);
 const assetIds=records.flatMap(row=>Array.isArray(row.slides)?row.slides.flatMap(slide=>slide&&typeof slide==='object'&&!Array.isArray(slide)&&typeof slide.assetId==='string'?[slide.assetId]:[]):[]);
 const assets=await getPrisma().mediaAsset.findMany({where:{id:{in:assetIds},category:'SLIDER',mime_type:'image/webp'},select:{id:true,public_url:true}});
 return NextResponse.json({success:true,data:{records,assets,locations:locations.map(row=>({country:row.country,city:row.city}))}},{headers:privateHeaders});
});
export const PUT=withActiveAdmin(async(req:Request)=>NextResponse.json({success:true,data:await saveRegionalContent(await securityJson(req,24*1024))},{headers:privateHeaders}));
