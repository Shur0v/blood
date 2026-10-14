import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES,getSessionFromRequest,hasRequiredRole } from '@/src/backend/utils/session';
export async function GET(req:Request){
 const session=getSessionFromRequest(req);
 if(!session)return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
 if(!hasRequiredRole(session,ADMIN_ROLES))return NextResponse.json({success:false,message:'Forbidden'},{status:403});
 try{
 const url=new URL(req.url);
 const parsed=z.object({page:z.string().min(1).max(2048),device:z.enum(['all','desktop','tablet','mobile']),days:z.coerce.number().int().min(0).max(365)}).safeParse({page:url.searchParams.get('page')||'home',device:url.searchParams.get('device')||'all',days:url.searchParams.get('days')||7});
 if(!parsed.success)return NextResponse.json({success:false,message:'Invalid filters.'},{status:400});
 const {page,device,days}=parsed.data;const db=getPrisma();const since=days===0?new Date(0):new Date(Date.now()-days*86400000);
 const where={page,created_at:{gte:since},...(device==='all'?{}:{device_type:device})};
 const heatWhere={...where,event_type:'click'};
 const deviceSql=device==='all'?Prisma.empty:Prisma.sql`AND device_type=${device}`;
 const [totalClicks,totalPoints,legacyPoints,bins,scrolls,pages,devices,siteTotal,recentPoints,sessionRows]=await Promise.all([
 db.analyticsClickLog.count({where}),db.analyticsHeatmapLog.count({where:heatWhere}),
 db.analyticsHeatmapLog.count({where:{...heatWhere,coordinate_space:'viewport'}}),
 db.$queryRaw<Array<{x:number;y:number;weight:bigint;target_path:string|null;target_x:number|null;target_y:number|null}>>(Prisma.sql`SELECT AVG(click_x) AS x,AVG(click_y) AS y,target_path,AVG(target_x) AS target_x,AVG(target_y) AS target_y,COUNT(*) AS weight FROM "AnalyticsHeatmapLog" WHERE page=${page} AND created_at>=${since} ${deviceSql} AND event_type='click' AND coordinate_space='document' AND click_x IS NOT NULL AND click_y IS NOT NULL GROUP BY floor(click_x*80),floor(click_y*200),target_path`),
 db.analyticsHeatmapLog.groupBy({by:['session_id'],where:{...where,event_type:'scroll'},_max:{scroll_depth:true}}),
 db.analyticsClickLog.groupBy({by:['page'],where:{created_at:{gte:since}},_count:{_all:true}}),
 db.analyticsClickLog.groupBy({by:['device_type'],where:{page,created_at:{gte:since}},_count:{_all:true}}),
 db.analyticsClickLog.count({where:{created_at:{gte:since}}}),
 db.analyticsHeatmapLog.count({where:{...heatWhere,created_at:{gte:new Date(Date.now()-86400000)}}}),
 db.analyticsHeatmapLog.groupBy({by:['session_id'],where:{...where,session_id:{not:null}}})]);
 const points=bins.map(p=>({x:Math.min(1,p.x),y:Math.min(1,p.y),weight:Number(p.weight),targetPath:p.target_path,targetX:p.target_x,targetY:p.target_y}));
 const mappedClicks=points.reduce((n,p)=>n+p.weight,0);
 const zones={topLeft:0,topRight:0,bottomLeft:0,bottomRight:0};for(const point of points){const key=point.y<.5?(point.x<.5?'topLeft':'topRight'):(point.x<.5?'bottomLeft':'bottomRight');zones[key]+=point.weight;}
 const top=Object.entries(zones).sort((a,b)=>b[1]-a[1])[0];const labels={topLeft:'Top-Left Zone',topRight:'Top-Right Zone',bottomLeft:'Bottom-Left Zone',bottomRight:'Bottom-Right Zone'};
 const depths=scrolls.map(row=>row._max.scroll_depth||0);
 return NextResponse.json({success:true,data:{selected:{page,device,days},zones,metrics:{totalClicks,totalPoints,mappedClicks,legacyPoints,siteTotal,recentPoints,sessionsProxy:sessionRows.length,topZone:top&&top[1]>0?labels[top[0] as keyof typeof labels]:'No Data',avgScrollDepth:depths.length?Math.round(depths.reduce((a,b)=>a+b,0)/depths.length):0},points,pageOptions:pages.map(row=>({page:row.page,count:row._count._all})).sort((a,b)=>b.count-a.count),deviceSplit:devices.map(row=>({device:row.device_type,clicks:row._count._all,percent:devices.reduce((n,p)=>n+p._count._all,0)?Math.round(row._count._all/devices.reduce((n,p)=>n+p._count._all,0)*1000)/10:0}))}},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({success:false,message:'Heatmap unavailable. Verify the analytics migration and database connection.'},{status:500});}
}
