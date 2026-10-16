import { getPrisma } from '@/src/backend/config/db';
import { NextResponse } from 'next/server';
import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { getPublicProfileSettings } from '@/src/backend/services/publicDonorProfiles';
export const GET = withActiveAdmin(async (_req: Request, {params}: {params: Promise<{userId:string}>}) => {const {userId}=await params;if(!await getPrisma().user.findUnique({where:{id:userId},select:{id:true}}))return NextResponse.json({success:false,message:'Account not found.'},{status:404,headers:privateHeaders});return NextResponse.json({ success: true, data: await getPublicProfileSettings(userId) }, { headers: privateHeaders });});
