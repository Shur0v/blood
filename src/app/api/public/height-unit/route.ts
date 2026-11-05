import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getRegionalHeightUnit} from '@/src/backend/services/regionalContent';

export async function GET(req:Request){
 const parsed=z.object({country:z.string().trim().min(2).max(100),city:z.string().trim().max(120).optional()}).safeParse(Object.fromEntries(new URL(req.url).searchParams));
 const headers={'Cache-Control':'no-store'};
 if(!parsed.success)return NextResponse.json({success:false,message:'Choose a valid country.'},{status:400,headers});
 return NextResponse.json({success:true,data:{unit:await getRegionalHeightUnit(parsed.data.country,parsed.data.city)}},{headers});
}
