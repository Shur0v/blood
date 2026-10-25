import {NextResponse} from 'next/server';
import {recoveryProgress} from '@/src/backend/services/recoveryProgress';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params,data=recoveryProgress(id,req.headers.get('x-recovery-progress'));return NextResponse.json({success:Boolean(data),...(data?{data}:{message:'Unauthorized.'})},{status:data?200:401,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex,nofollow'}});}catch{return NextResponse.json({success:false,message:'Operation unavailable.'},{status:404});}}
