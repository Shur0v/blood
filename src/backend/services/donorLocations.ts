import { cache } from 'react';
import { getPrisma } from '../config/db';
import { toLocationSlug } from '../utils/locationSlug';
import { normalizeOrganList } from '@/src/lib/organCatalog';

export type DonorLocation = {
  city: string; country: string; bloodCount: number; organCount: number;
  bloodGroups: string[]; organs: string[]; updatedAt: Date;
};
type LocationRow = { city: string; country: string; blood_count: bigint; organ_count: bigint; blood_groups: string[]; organs: string[]; updated_at: Date };

// Aggregate public availability only. No patient IDs, contact details, or records.
// React cache deduplicates metadata/page reads within a request, not across visits.
export const getDonorLocations = cache(async (): Promise<DonorLocation[]> => {
  const rows = await getPrisma().$queryRaw<LocationRow[]>`
    WITH user_locations AS (
      SELECT id AS user_id, location_city AS city, location_country AS country, updated_at AS location_changed_at FROM "User" WHERE is_active_donor = true
      UNION ALL
      SELECT sc.user_id, sc.city, sc.country, sc.created_at FROM "UserServiceCity" sc JOIN "User" u ON u.id=sc.user_id WHERE u.is_active_donor=true
    ), entries AS (
      SELECT 'blood' AS kind, 'user:' || u.id AS donor_id, l.city, l.country, u.blood_group, NULL::text AS organ, GREATEST(u.updated_at,l.location_changed_at) AS changed_at
      FROM user_locations l JOIN "User" u ON u.id=l.user_id
      UNION ALL
      SELECT 'blood', 'manual:' || id, location_city, location_country, blood_group, NULL::text, created_at FROM "ManualBloodDonor" WHERE is_active_donor=true
      UNION ALL
      SELECT 'blood', 'community:' || id, location_city, location_country, NULL::text, NULL::text, created_at FROM "CommunityDonor" WHERE is_active=true
      UNION ALL
      SELECT 'organ', 'user:' || u.id, l.city, l.country, NULL::text, op.organ_type, GREATEST(u.updated_at,op.updated_at,l.location_changed_at)
      FROM user_locations l JOIN "User" u ON u.id=l.user_id JOIN "OrganPledge" op ON op.user_id=u.id WHERE op.is_active=true
      UNION ALL
      SELECT 'organ', 'manual:' || id, location_city, location_country, NULL::text, organ_type, created_at FROM "ManualOrganDonor"
    )
    SELECT MIN(TRIM(city)) AS city, MIN(TRIM(country)) AS country,
      COUNT(DISTINCT donor_id) FILTER (WHERE kind='blood') AS blood_count,
      COUNT(DISTINCT donor_id) FILTER (WHERE kind='organ') AS organ_count,
      ARRAY_AGG(DISTINCT blood_group) FILTER (WHERE blood_group IS NOT NULL) AS blood_groups,
      ARRAY_AGG(DISTINCT organ) FILTER (WHERE organ IS NOT NULL) AS organs,
      MAX(changed_at) AS updated_at
    FROM entries WHERE TRIM(city)<>'' AND TRIM(country)<>''
    GROUP BY LOWER(TRIM(country)), LOWER(TRIM(city))
    ORDER BY LOWER(TRIM(country)), LOWER(TRIM(city))
  `;
  return rows.filter(row => toLocationSlug(row.country) && toLocationSlug(row.city)).map(row => ({
    city: row.city, country: row.country, bloodCount: Number(row.blood_count), organCount: Number(row.organ_count),
    bloodGroups: (row.blood_groups || []).sort(), organs: normalizeOrganList((row.organs || []).flatMap(value => value.split(','))), updatedAt: row.updated_at,
  }));
});

export const donorLocationPath = (row: Pick<DonorLocation,'country'|'city'>, mode: 'blood'|'organ') => `/${mode}-donors/${toLocationSlug(row.country)}/${toLocationSlug(row.city)}`;
export const findDonorLocation = async (country: string, city: string) => (await getDonorLocations()).find(row => toLocationSlug(row.country) === country && toLocationSlug(row.city) === city);

export const getLocationDonorPreview = cache(async (country:string,city:string,mode:'blood'|'organ',bloodGroup?:string) => {
  const { Prisma } = await import('@prisma/client');
  const location = Prisma.sql`((LOWER(u.location_country)=LOWER(${country}) AND LOWER(u.location_city)=LOWER(${city})) OR EXISTS (SELECT 1 FROM "UserServiceCity" sc WHERE sc.user_id=u.id AND LOWER(sc.country)=LOWER(${country}) AND LOWER(sc.city)=LOWER(${city})))`;
  const registered = mode==='blood'
    ? Prisma.sql`SELECT u.name,u.blood_group AS category,u.created_at FROM "User" u WHERE u.is_active_donor=true AND ${location} ${bloodGroup?Prisma.sql`AND u.blood_group=${bloodGroup}`:Prisma.empty}`
    : Prisma.sql`SELECT u.name,op.organ_type AS category,op.created_at FROM "User" u JOIN "OrganPledge" op ON op.user_id=u.id WHERE u.is_active_donor=true AND op.is_active=true AND ${location}`;
  const manual = mode==='blood'
    ? Prisma.sql`SELECT name,blood_group AS category,created_at FROM "ManualBloodDonor" WHERE is_active_donor=true AND LOWER(location_country)=LOWER(${country}) AND LOWER(location_city)=LOWER(${city}) ${bloodGroup?Prisma.sql`AND blood_group=${bloodGroup}`:Prisma.empty}`
    : Prisma.sql`SELECT name,organ_type AS category,created_at FROM "ManualOrganDonor" WHERE LOWER(location_country)=LOWER(${country}) AND LOWER(location_city)=LOWER(${city})`;
  return getPrisma().$queryRaw<Array<{name:string;category:string;created_at:Date}>>(Prisma.sql`SELECT name,category,created_at FROM (${registered} UNION ALL ${manual}) entries ORDER BY created_at DESC,name ASC LIMIT 8`);
});

export const getLocationBloodGroupCounts = cache(async (country:string,city:string) => {
  const rows=await getPrisma().$queryRaw<Array<{blood_group:string;total:bigint}>>`
    SELECT blood_group,COUNT(*) AS total FROM (
      SELECT u.blood_group FROM "User" u WHERE u.is_active_donor=true
      AND ((LOWER(u.location_country)=LOWER(${country}) AND LOWER(u.location_city)=LOWER(${city}))
        OR EXISTS(SELECT 1 FROM "UserServiceCity" sc WHERE sc.user_id=u.id AND LOWER(sc.country)=LOWER(${country}) AND LOWER(sc.city)=LOWER(${city})))
      UNION ALL
      SELECT blood_group FROM "ManualBloodDonor" WHERE is_active_donor=true AND LOWER(location_country)=LOWER(${country}) AND LOWER(location_city)=LOWER(${city})
    ) entries GROUP BY blood_group
  `;
  return Object.fromEntries(rows.map(row=>[row.blood_group,Number(row.total)]));
});
