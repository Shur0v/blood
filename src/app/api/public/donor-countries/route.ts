import { NextResponse } from 'next/server';
import { getDonorCountryCoverage } from '@/src/backend/services/donorCoverage';
export const dynamic='force-dynamic';
export async function GET(){
  try{
    const coverage=await getDonorCountryCoverage();
    return NextResponse.json({success:true,data:coverage.map(row=>row.country),counts:Object.fromEntries(coverage.map(row=>[row.country,row.count]))},{headers:{'Cache-Control':'no-store'}});
  }
  catch{return NextResponse.json({success:false,message:'Donor countries could not be loaded.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
