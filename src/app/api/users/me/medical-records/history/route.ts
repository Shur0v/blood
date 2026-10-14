import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listMedicalTimeline } from '@/src/backend/services/medicalReports';
import { medicalUser, medicalFailure, MedicalError, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { boundedBody } from '@/src/backend/utils/boundedBody';

export const runtime = 'nodejs';
const Query = z.object({mode:z.enum(['reports','prescriptions']),q:z.string().max(200).default(''),category:z.string().max(100).default(''),from:z.string().max(10).default(''),to:z.string().max(10).default(''),cursor:z.string().max(1000).optional()}).strict();
// Medical search terms stay out of URLs, browser history, and ordinary access logs.
export async function POST(req: Request) {
  try {
    const userId = medicalUser(req);
    let input:unknown;
    try { input=JSON.parse(new TextDecoder().decode(await boundedBody(req,8192))); }
    catch(error) {if(error instanceof MedicalError)throw error;throw new MedicalError('Invalid history filters.');}
    const parsed=Query.safeParse(input);
    if(!parsed.success)throw new MedicalError('Invalid history filters.');
    const {mode,...filters}=parsed.data;
    const params=new URLSearchParams(Object.entries(filters).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));
    return NextResponse.json({success:true,data:await listMedicalTimeline(userId,mode,params)},{headers:privateHeaders});
  } catch(error) {return medicalFailure(error);}
}
