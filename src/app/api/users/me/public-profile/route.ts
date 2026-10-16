import { NextResponse } from 'next/server';
import { medicalUser, medicalFailure, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
// Legacy URLs stay explicit: ordinary accounts cannot publish or edit public profiles.
export async function GET(req:Request) {
  try {medicalUser(req);return NextResponse.json({success:false,message:'Public donor profiles are managed by administrators.'},{status:403,headers:privateHeaders});}
  catch(error){return medicalFailure(error);}
}
export const PATCH=GET;