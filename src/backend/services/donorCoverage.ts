import { Prisma } from '@prisma/client';
import { getPrisma } from '../config/db';

// Individual donor coverage; organisations alone do not create country options.
export async function getDonorCountries() {
  const rows=await getPrisma().$queryRaw<{country:string}[]>(Prisma.sql`
    SELECT MIN(TRIM(country)) AS country FROM (
      SELECT location_country AS country FROM "User" WHERE is_active_donor=true
      UNION ALL SELECT sc.country FROM "UserServiceCity" sc JOIN "User" u ON u.id=sc.user_id WHERE u.is_active_donor=true
      UNION ALL SELECT location_country FROM "ManualBloodDonor" WHERE is_active_donor=true
      UNION ALL SELECT location_country FROM "ManualOrganDonor"
    ) coverage WHERE TRIM(country)<>'' GROUP BY LOWER(TRIM(country)) ORDER BY LOWER(TRIM(country))
  `);return rows.map(row=>row.country);
}

// Server-only approximate origin. A one-donor country must not expose that
// donor's coordinates through the public country endpoint.
export async function getDiscoveryOrigin(country?:string,city?:string):Promise<{lat:number;lng:number}|null>{
  if(!country)return null;
  try {
  const rows=await getPrisma().$queryRaw<{lat:number;lng:number}[]>(Prisma.sql`
    WITH points AS (
      SELECT location_city AS city,location_country AS country,location_lat AS lat,location_lng AS lng FROM "User" WHERE is_active_donor=true
      UNION ALL SELECT sc.city,sc.country,sc.lat,sc.lng FROM "UserServiceCity" sc JOIN "User" u ON u.id=sc.user_id WHERE u.is_active_donor=true
      UNION ALL SELECT location_city,location_country,location_lat,location_lng FROM "ManualBloodDonor" WHERE is_active_donor=true
      UNION ALL SELECT location_city,location_country,location_lat,location_lng FROM "ManualOrganDonor"
    ), valid AS (
      SELECT * FROM points WHERE LOWER(TRIM(country))=LOWER(TRIM(${country})) AND lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180 AND NOT(lat=0 AND lng=0)
    ) SELECT COALESCE(AVG(lat) FILTER(WHERE LOWER(TRIM(city))=LOWER(TRIM(${city||''}))),AVG(lat))::float8 AS lat,
      COALESCE(AVG(lng) FILTER(WHERE LOWER(TRIM(city))=LOWER(TRIM(${city||''}))),AVG(lng))::float8 AS lng FROM valid
  `);const row=rows[0];return row&&Number.isFinite(row.lat)&&Number.isFinite(row.lng)?row:null;
  } catch {
    const db=getPrisma(),filter={equals:country,mode:'insensitive' as const};
    const [users,manual,organs]=await Promise.all([
      db.user.findMany({where:{is_active_donor:true,OR:[{location_country:filter},{ServiceCities:{some:{country:filter}}}]},select:{location_city:true,location_country:true,location_lat:true,location_lng:true,ServiceCities:{where:{country:filter},select:{city:true,lat:true,lng:true}}}}),
      db.manualBloodDonor.findMany({where:{is_active_donor:true,location_country:filter},select:{location_city:true,location_lat:true,location_lng:true}}),
      db.manualOrganDonor.findMany({where:{location_country:filter},select:{location_city:true,location_lat:true,location_lng:true}}),
    ]);
    const points=[...users.flatMap(user=>[...(user.location_country.trim().toLowerCase()===country.trim().toLowerCase()?[{city:user.location_city,lat:user.location_lat,lng:user.location_lng}]:[]),...user.ServiceCities]),...manual.map(row=>({city:row.location_city,lat:row.location_lat,lng:row.location_lng})),...organs.map(row=>({city:row.location_city,lat:row.location_lat,lng:row.location_lng}))].filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180&&(p.lat!==0||p.lng!==0));
    const local=points.filter(p=>p.city.trim().toLowerCase()===(city||'').trim().toLowerCase()),chosen=local.length?local:points;
    return chosen.length?{lat:chosen.reduce((sum,p)=>sum+p.lat,0)/chosen.length,lng:chosen.reduce((sum,p)=>sum+p.lng,0)/chosen.length}:null;
  }
}
