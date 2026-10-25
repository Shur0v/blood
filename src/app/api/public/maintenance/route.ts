import {NextResponse} from 'next/server';
import {maintenancePublic} from '@/src/lib/maintenanceState.server';
export const dynamic='force-dynamic';
export function GET(){return NextResponse.json({success:true,data:maintenancePublic()},{headers:{'Cache-Control':'no-store'}});}
