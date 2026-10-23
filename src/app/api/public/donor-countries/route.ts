import { NextResponse } from 'next/server';
import { getDonorCountries } from '@/src/backend/services/donorCoverage';
export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json({success:true,data:await getDonorCountries()},{headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({success:false,message:'Donor countries could not be loaded.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
