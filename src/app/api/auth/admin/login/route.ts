import { NextResponse } from 'next/server';
export async function POST(){return NextResponse.json({success:false,message:'Invalid credentials.'},{status:401,headers:{'Cache-Control':'no-store'}});}
