import {NextResponse} from 'next/server';
import {requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {medicalFailure,privateHeaders,MedicalError} from '@/src/backend/utils/medicalPrivacy';
import {readJob,publicJob,verifyProgressToken} from '@/src/backend/services/recoveryStore';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params,token=req.headers.get('x-recovery-progress');const scoped=Boolean(token&&verifyProgressToken(token,id));if(!scoped)await requireActiveAdmin(req);const job=readJob(id);return NextResponse.json({success:true,data:scoped?{id:job.id,kind:job.kind,status:job.status,stage:job.stage}:publicJob(job)},{headers:privateHeaders});}catch(e){return medicalFailure(e);}}
