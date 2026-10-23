import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { getActiveBloodDonorCounts } from '@/src/backend/services/donorCounts';
import {compareDonors,selectServiceCity} from '@/src/lib/donorOrdering';
import {getDiscoveryOrigin} from '@/src/backend/services/donorCoverage';
import { NEARBY_COUNTRY_MAP, normalizeCountryToken } from '@/src/lib/geoCountry';

export const dynamic = 'force-dynamic';
const freshDonorHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(16).default(16),
  cursor: z.string().optional(),
  bloodGroup: z.string().min(1).max(10).optional(),
  search: z.string().min(1).max(120).optional(),
  viewerCity: z.string().min(1).max(120).optional(),
  viewerCountry: z.string().min(1).max(120).optional(),
  country: z.string().min(1).max(120).optional(),
  viewerLat: z.coerce.number().min(-90).max(90).optional(),
  viewerLng: z.coerce.number().min(-180).max(180).optional(),
  sort: z.enum(['NEWEST', 'NEARBY']).default('NEWEST'),
  expand: z.enum(['nearby']).optional(),
});

interface PublicDonorRow {
  internal_lat: number; internal_lng: number;
  id: string;
  name: string;
  blood_group: string | null;
  location_city: string;
  location_country: string;
  mobile: string;
  verification_status: string | null;
  hemoglobin: string | null;
  last_donation_date: Date | null;
  source_type: 'REGISTERED' | 'MANUAL' | 'COMMUNITY';
  created_at: Date;
  sort_at: Date;
  is_community: boolean;
  community_rank: number;
}

interface CountRow {
  total: bigint | number | string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      limit: url.searchParams.get('limit') || '16',
      cursor: url.searchParams.get('cursor') || undefined,
      bloodGroup: url.searchParams.get('bloodGroup') || undefined,
      search: url.searchParams.get('search') || undefined,
      viewerCity: url.searchParams.get('viewerCity') || undefined,
      viewerCountry: url.searchParams.get('viewerCountry') || (url.searchParams.get('expand')==='nearby'?url.searchParams.get('country'):undefined) || undefined,
      country: url.searchParams.get('country') || undefined,
      viewerLat: url.searchParams.get('viewerLat') ?? undefined,
      viewerLng: url.searchParams.get('viewerLng') ?? undefined,
      sort: url.searchParams.get('sort') || 'NEWEST',
      expand: url.searchParams.get('expand') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { limit, cursor, bloodGroup, search, viewerCity, viewerCountry, country:selectedCountry, sort:selectedSort, viewerLat:requestedLat, viewerLng:requestedLng, expand } = parsed.data;
    const country=expand?undefined:selectedCountry,sort=expand?'NEARBY':selectedSort;
    const origin=expand&&requestedLat===undefined?await getDiscoveryOrigin(selectedCountry,viewerCity):null;
    const viewerLat=requestedLat??origin?.lat,viewerLng=requestedLng??origin?.lng;
    const offset = cursor ? Number.parseInt(cursor, 10) : 0;
    const safeOffset = Number.isNaN(offset) || offset < 0 ? 0 : offset;
    const normalizedSearch = search?.trim();
    const normalizedSearchLower = normalizedSearch?.toLowerCase() || '';
    const communityKeyword = 'community';
    const isCommunitySearchOnly = normalizedSearchLower === communityKeyword;
    const hasCommunityKeyword = normalizedSearchLower.includes(communityKeyword);
    const communityCountryHint = hasCommunityKeyword
      ? normalizedSearchLower.replace(communityKeyword, '').trim()
      : '';
    const searchLike = normalizedSearch ? `%${normalizedSearch}%` : null;
    const normalizedViewerCity = viewerCity?.trim();
    const normalizedViewerCountry = viewerCountry?.trim();
    const canonicalViewerCountry = normalizeCountryToken(normalizedViewerCountry);
    const nearbyCountries = canonicalViewerCountry ? (NEARBY_COUNTRY_MAP[canonicalViewerCountry] || []) : [];
    const normalizedCountry = country?.trim();
    const userFilterByCountry = normalizedCountry
      ? Prisma.sql`AND (
          LOWER(u.location_country) = LOWER(${normalizedCountry})
          OR EXISTS (
            SELECT 1 FROM "UserServiceCity" usc
            WHERE usc.user_id = u.id
              AND LOWER(usc.country) = LOWER(${normalizedCountry})
          )
        )`
      : Prisma.empty;
    const manualFilterByCountry = normalizedCountry
      ? Prisma.sql`AND LOWER(mbd.location_country) = LOWER(${normalizedCountry})`
      : Prisma.empty;
    const communityFilterByCountry = normalizedCountry
      ? Prisma.sql`AND LOWER(cd.location_country) = LOWER(${normalizedCountry})`
      : Prisma.empty;

    const prisma = getPrisma();

    const userFilterByBlood = bloodGroup ? Prisma.sql`AND u.blood_group = ${bloodGroup}` : Prisma.empty;
    const manualFilterByBlood = bloodGroup ? Prisma.sql`AND mbd.blood_group = ${bloodGroup}` : Prisma.empty;
    const userFilterBySearch = searchLike
      ? Prisma.sql`
          AND (
            u.name ILIKE ${searchLike}
            OR u.location_city ILIKE ${searchLike}
            OR u.location_country ILIKE ${searchLike}
            OR u.mobile ILIKE ${searchLike}
            OR EXISTS (
              SELECT 1
              FROM "UserServiceCity" usc
              WHERE usc.user_id = u.id
                AND (usc.city ILIKE ${searchLike} OR usc.country ILIKE ${searchLike})
            )
          )
        `
      : Prisma.empty;
    const manualFilterBySearch = searchLike
      ? Prisma.sql`
          AND (
            COALESCE(mbd.name, 'BloodNet Donor') ILIKE ${searchLike}
            OR mbd.location_city ILIKE ${searchLike}
            OR mbd.location_country ILIKE ${searchLike}
            OR mbd.mobile ILIKE ${searchLike}
          )
        `
      : Prisma.empty;
    const communitySearchLike = communityCountryHint ? `%${communityCountryHint}%` : searchLike;
    const communityFilterBySearch = isCommunitySearchOnly
      ? Prisma.empty
      : communitySearchLike
      ? Prisma.sql`
          AND (
            cd.organization_name ILIKE ${communitySearchLike}
            OR COALESCE(cd.contact_person, '') ILIKE ${communitySearchLike}
            OR cd.location_city ILIKE ${communitySearchLike}
            OR cd.location_country ILIKE ${communitySearchLike}
            OR cd.mobile ILIKE ${communitySearchLike}
          )
        `
      : Prisma.empty;
    const serviceCitySearchRank = searchLike
      ? Prisma.sql`CASE WHEN usc.city ILIKE ${searchLike} OR usc.country ILIKE ${searchLike} THEN 0 ELSE 1 END`
      : Prisma.sql`1::integer`;
    const serviceCityViewerCityRank = normalizedViewerCity
      ? Prisma.sql`CASE WHEN LOWER(usc.city) = LOWER(${normalizedViewerCity}) THEN 0 ELSE 1 END`
      : Prisma.sql`1::integer`;
    const serviceCityViewerCountryRank = normalizedViewerCountry
      ? Prisma.sql`CASE WHEN LOWER(usc.country) = LOWER(${normalizedViewerCountry}) THEN 0 ELSE 1 END`
      : Prisma.sql`1::integer`;
    const donorViewerCityRank = normalizedViewerCity
      ? Prisma.sql`CASE WHEN LOWER(donors.location_city) = LOWER(${normalizedViewerCity}) THEN 0 ELSE 1 END`
      : Prisma.sql`1::integer`;
    const donorViewerCountryRank = normalizedViewerCountry
      ? Prisma.sql`CASE
          WHEN LOWER(donors.location_country) = LOWER(${normalizedViewerCountry}) THEN 0
          WHEN LOWER(donors.location_country) = LOWER(${canonicalViewerCountry}) THEN 0
          ${nearbyCountries.length > 0
            ? Prisma.sql`WHEN LOWER(donors.location_country) IN (${Prisma.join(nearbyCountries)}) THEN 1`
            : Prisma.empty}
          ELSE 2
        END`
      : Prisma.sql`2`;

    const rows = await prisma.$queryRaw<PublicDonorRow[]>(Prisma.sql`
      SELECT *
      FROM (
        SELECT
          u.id,
          u.name,
          u.blood_group,
          COALESCE(sc.city, u.location_city) AS location_city,
          COALESCE(sc.country, u.location_country) AS location_country,
          COALESCE(sc.lat,u.location_lat) AS internal_lat, COALESCE(sc.lng,u.location_lng) AS internal_lng,
          u.mobile,
          u.verification_status,
          CASE
            WHEN u.health_data IS NULL THEN NULL
            ELSE u.health_data ->> 'hemoglobin'
          END AS hemoglobin,
          u.last_donation_date,
          'REGISTERED'::text AS source_type,
          u.created_at,
          u.created_at AS sort_at,
          FALSE AS is_community,
          1 AS community_rank
        FROM "User" u
        LEFT JOIN LATERAL (
          SELECT usc.city, usc.country, usc.lat, usc.lng
          FROM (SELECT city,country,lat,lng,created_at,id FROM "UserServiceCity" WHERE user_id=u.id
            UNION ALL SELECT u.location_city,u.location_country,u.location_lat,u.location_lng,u.created_at,u.id WHERE ${Boolean(expand)}) usc
          WHERE TRUE
            ${normalizedCountry ? Prisma.sql`AND LOWER(usc.country) = LOWER(${normalizedCountry})` : Prisma.empty}
          ORDER BY
            ${serviceCitySearchRank} ASC,
            ${serviceCityViewerCityRank} ASC,
            ${serviceCityViewerCountryRank} ASC,
            usc.created_at ASC, usc.id ASC
          LIMIT 1
        ) sc ON TRUE
        WHERE u.is_active_donor = true
        ${userFilterByCountry}
        ${userFilterByBlood}
        ${userFilterBySearch}

        UNION ALL

        SELECT
          mbd.id,
          COALESCE(mbd.name, 'BloodNet Donor') AS name,
          mbd.blood_group,
          mbd.location_city,
          mbd.location_country,
          mbd.location_lat AS internal_lat, mbd.location_lng AS internal_lng,
          mbd.mobile,
          mbd.verification_status,
          CASE
            WHEN mbd.health_data IS NULL THEN NULL
            ELSE mbd.health_data ->> 'hemoglobin'
          END AS hemoglobin,
          mbd.last_donation_date,
          'MANUAL'::text AS source_type,
          mbd.created_at,
          mbd.created_at AS sort_at,
          FALSE AS is_community,
          1 AS community_rank
        FROM "ManualBloodDonor" mbd
        WHERE mbd.is_active_donor = true
        ${manualFilterByCountry}
        ${manualFilterByBlood}
        ${manualFilterBySearch}

        UNION ALL

        SELECT
          cd.id,
          cd.organization_name AS name,
          NULL::text AS blood_group,
          cd.location_city,
          cd.location_country,
          cd.location_lat AS internal_lat, cd.location_lng AS internal_lng,
          cd.mobile,
          cd.verification_status,
          NULL::text AS hemoglobin,
          NULL::timestamp AS last_donation_date,
          'COMMUNITY'::text AS source_type,
          cd.created_at,
          cd.created_at AS sort_at,
          TRUE AS is_community,
          CASE
            WHEN dc.total_donors = 0 THEN 0
            WHEN dc.total_donors > 50 THEN 2
            ELSE 1
          END AS community_rank
        FROM "CommunityDonor" cd
        LEFT JOIN (
          SELECT location_country, COUNT(*)::int AS total_donors
          FROM (
            SELECT u.location_country
            FROM "User" u
            WHERE u.is_active_donor = true
            UNION ALL
            SELECT mbd.location_country
            FROM "ManualBloodDonor" mbd
            WHERE mbd.is_active_donor = true
          ) all_donors
          GROUP BY location_country
        ) dc ON LOWER(dc.location_country) = LOWER(cd.location_country)
        WHERE cd.is_active = true
         ${bloodGroup ? Prisma.sql`AND FALSE` : Prisma.empty}
        
        ${communityFilterByCountry}
        ${communityFilterBySearch}
      ) AS donors
      ORDER BY
        ${expand?Prisma.sql`CASE WHEN LOWER(TRIM(donors.location_country))=LOWER(TRIM(${selectedCountry||''})) THEN CASE WHEN LOWER(TRIM(donors.location_city))=LOWER(TRIM(${viewerCity||''})) THEN 0 ELSE 1 END ELSE 2 END`:Prisma.sql`0::integer`} ASC,
        ${sort === 'NEARBY' && viewerLat !== undefined && viewerLng !== undefined ? Prisma.sql`acos(LEAST(1.0, GREATEST(-1.0, sin(radians(${viewerLat}::float8))*sin(radians(donors.internal_lat)) + cos(radians(${viewerLat}::float8))*cos(radians(donors.internal_lat))*cos(radians(donors.internal_lng-${viewerLng}::float8)))))` : Prisma.sql`NULL::float8`} ASC NULLS LAST,
        ${hasCommunityKeyword ? Prisma.sql`CASE WHEN donors.is_community THEN 0 ELSE 1 END` : Prisma.sql`1::integer`} ASC,
        CASE WHEN ${sort === 'NEWEST'} THEN
          CASE WHEN ${hasCommunityKeyword} AND donors.is_community THEN -1
            WHEN donors.source_type = 'REGISTERED' THEN 0
            WHEN donors.source_type = 'MANUAL' THEN 1 ELSE 2 END
          ELSE 0 END ASC,
        CASE WHEN ${sort === 'NEWEST'} THEN donors.created_at ELSE NULL END DESC,
        CASE WHEN ${sort === 'NEWEST'} THEN donors.id ELSE NULL END DESC,
        ${donorViewerCityRank} ASC,
        ${donorViewerCountryRank} ASC,
        donors.location_country ASC,
        donors.sort_at DESC,
        donors.id DESC
      LIMIT ${limit + 1}
      OFFSET ${safeOffset}
    `);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    const publicData = data.map(({internal_lat,internal_lng,...row})=>row);

    const totalRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT (
        (SELECT COUNT(*)
         FROM "User" u
         WHERE u.is_active_donor = true
         ${userFilterByCountry}
         ${userFilterByBlood}
         ${userFilterBySearch}
        )
        +
        (SELECT COUNT(*)
         FROM "ManualBloodDonor" mbd
         WHERE mbd.is_active_donor = true
         ${manualFilterByCountry}
         ${manualFilterByBlood}
         ${manualFilterBySearch}
        )
        +
        (SELECT COUNT(*)
         FROM "CommunityDonor" cd
         WHERE cd.is_active = true
         ${bloodGroup ? Prisma.sql`AND FALSE` : Prisma.empty}
         
         ${communityFilterByCountry}
         ${communityFilterBySearch}
        )
      ) AS total
    `);

    const totalValue = totalRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue);

    const { total: globalTotal } = await getActiveBloodDonorCounts();

    return NextResponse.json({
      success: true,
      data: publicData,
      pagination: {
        limit,
        nextCursor: hasMore ? String(safeOffset + limit) : null,
        total,
      },
      meta: {
        globalTotal,
        ...(expand?{expanded:true,priorityCountry:selectedCountry||'',priorityCity:viewerCity||''}:{}),
      },
    }, { headers: freshDonorHeaders });
  } catch (error) {
    try {
      const url = new URL(req.url);
      const parsed = QuerySchema.safeParse({
        limit: url.searchParams.get('limit') || '16',
        cursor: url.searchParams.get('cursor') || undefined,
        bloodGroup: url.searchParams.get('bloodGroup') || undefined,
        search: url.searchParams.get('search') || undefined,
        viewerCity: url.searchParams.get('viewerCity') || undefined,
        viewerCountry: url.searchParams.get('viewerCountry') || (url.searchParams.get('expand')==='nearby'?url.searchParams.get('country'):undefined) || undefined,
        country: url.searchParams.get('country') || undefined,
      viewerLat: url.searchParams.get('viewerLat') ?? undefined,
      viewerLng: url.searchParams.get('viewerLng') ?? undefined,
        sort: url.searchParams.get('sort') || 'NEWEST',
        expand: url.searchParams.get('expand') || undefined,
      });

      if (!parsed.success) {
        return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
      }

      const { limit, cursor, bloodGroup, search, viewerCity, viewerCountry, country:selectedCountry, sort:selectedSort, viewerLat:requestedLat, viewerLng:requestedLng,expand } = parsed.data;
      const country=expand?undefined:selectedCountry,sort=expand?'NEARBY':selectedSort;
      const origin=expand&&requestedLat===undefined?await getDiscoveryOrigin(selectedCountry,viewerCity):null;
      const viewerLat=requestedLat??origin?.lat,viewerLng=requestedLng??origin?.lng;
      const offset = cursor ? Number.parseInt(cursor, 10) : 0;
      const safeOffset = Number.isNaN(offset) || offset < 0 ? 0 : offset;
      const q = search?.trim();
      const qLower = q?.toLowerCase() || '';
      const isCommunitySearchOnly = qLower === 'community';
      const hasCommunityKeyword = qLower.includes('community');
      const communityCountryHint = hasCommunityKeyword ? qLower.replace('community', '').trim() : '';
      const normalizedViewerCity = viewerCity?.trim().toLowerCase();
      const normalizedViewerCountry = viewerCountry?.trim().toLowerCase();
      const canonicalViewerCountry = normalizeCountryToken(normalizedViewerCountry);
      const nearbyCountries = canonicalViewerCountry ? (NEARBY_COUNTRY_MAP[canonicalViewerCountry] || []) : [];
      const normalizedCountry = country?.trim();

      const prisma = getPrisma();
      const userWhere = {
        is_active_donor: true,
        ...(normalizedCountry
          ? {
              AND: [{ OR: [
                { location_country: { equals: normalizedCountry, mode: 'insensitive' as const } },
                { ServiceCities: { some: { country: { equals: normalizedCountry, mode: 'insensitive' as const } } } },
              ] }],
            }
          : {}),
        ...(bloodGroup ? { blood_group: bloodGroup } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { location_city: { contains: q, mode: 'insensitive' as const } },
                { location_country: { contains: q, mode: 'insensitive' as const } },
                { mobile: { contains: q, mode: 'insensitive' as const } },
                { ServiceCities: { some: { OR: [{ city: { contains: q, mode: 'insensitive' as const } }, { country: { contains: q, mode: 'insensitive' as const } }] } } },
              ],
            }
          : {}),
      };
      const manualWhere = {
        is_active_donor: true,
        ...(normalizedCountry ? { location_country: { equals: normalizedCountry, mode: 'insensitive' as const } } : {}),
        ...(bloodGroup ? { blood_group: bloodGroup } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { location_city: { contains: q, mode: 'insensitive' as const } },
                { location_country: { contains: q, mode: 'insensitive' as const } },
                { mobile: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };
      const communityWhere = {
        ...(bloodGroup ? {id:{in:[] as string[]}} : {}),
        is_active: true,
        ...(normalizedCountry ? { location_country: { equals: normalizedCountry, mode: 'insensitive' as const } } : {}),
        ...(isCommunitySearchOnly
          ? {}
          : communityCountryHint
          ? {
              OR: [
                { organization_name: { contains: communityCountryHint, mode: 'insensitive' as const } },
                { contact_person: { contains: communityCountryHint, mode: 'insensitive' as const } },
                { location_city: { contains: communityCountryHint, mode: 'insensitive' as const } },
                { location_country: { contains: communityCountryHint, mode: 'insensitive' as const } },
                { mobile: { contains: communityCountryHint, mode: 'insensitive' as const } },
              ],
            }
          : q
          ? {
              OR: [
                { organization_name: { contains: q, mode: 'insensitive' as const } },
                { contact_person: { contains: q, mode: 'insensitive' as const } },
                { location_city: { contains: q, mode: 'insensitive' as const } },
                { location_country: { contains: q, mode: 'insensitive' as const } },
                { mobile: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [users, manualRows, communityRows, userCount, manualCount, communityCount, globalCounts] = await Promise.all([
        prisma.user.findMany({ where: userWhere, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: sort==='NEARBY'?undefined:limit + safeOffset + 1,
          include: { ServiceCities: { where: normalizedCountry ? { country: { equals: normalizedCountry, mode: 'insensitive' } } : undefined, select: { id:true,city:true,country:true,lat:true,lng:true,created_at:true } } } }),
        prisma.manualBloodDonor.findMany({ where: manualWhere, orderBy: [{ created_at: 'desc' },{id:'desc'}], take: sort==='NEARBY'?undefined:limit + safeOffset + 1 }),
        prisma.communityDonor.findMany({ where: communityWhere, orderBy: { created_at: 'desc' }, take: sort==='NEARBY'?undefined:limit + safeOffset + 8 }),
        prisma.user.count({ where: userWhere }),
        prisma.manualBloodDonor.count({ where: manualWhere }),
        prisma.communityDonor.count({ where: communityWhere }),
        getActiveBloodDonorCounts(),
      ]);

      const orderContext={sort,viewerCity,viewerCountry,viewerLat,viewerLng,search:q,priorityCountry:expand?selectedCountry:undefined};
      const locatedUsers=users.map(user=>({...user,discoveryCity:selectServiceCity([...user.ServiceCities,...(expand?[{city:user.location_city,country:user.location_country,lat:user.location_lat,lng:user.location_lng,created_at:user.created_at,id:user.id}]:[])],orderContext)}));
      const merged = [
        ...locatedUsers.map((u) => ({
          id: u.id,
          name: u.name,
          blood_group: u.blood_group,
          location_city:u.discoveryCity?.city||u.location_city,
          internal_lat:u.discoveryCity?.lat??u.location_lat, internal_lng:u.discoveryCity?.lng??u.location_lng,
          location_country:u.discoveryCity?.country||u.location_country,
          mobile: u.mobile,
          verification_status: u.verification_status,
          hemoglobin:
            u.health_data && typeof u.health_data === 'object' && 'hemoglobin' in (u.health_data as Record<string, unknown>)
              ? String((u.health_data as Record<string, unknown>).hemoglobin ?? '')
              : null,
          last_donation_date: u.last_donation_date,
          source_type: 'REGISTERED' as const,
          created_at: u.created_at,
          sort_at: u.created_at,
          is_community: false,
          community_rank: 1,
        })),
        ...manualRows.map((m) => ({
          id: m.id,
          name: m.name || 'BloodNet Donor',
          blood_group: m.blood_group,
          internal_lat:m.location_lat,internal_lng:m.location_lng,
          location_city: m.location_city,
          location_country: m.location_country,
          mobile: m.mobile,
          verification_status: m.verification_status,
          hemoglobin:
            m.health_data && typeof m.health_data === 'object' && 'hemoglobin' in (m.health_data as Record<string, unknown>)
              ? String((m.health_data as Record<string, unknown>).hemoglobin ?? '')
              : null,
          last_donation_date: m.last_donation_date,
          source_type: 'MANUAL' as const,
          created_at: m.created_at,
          sort_at: m.created_at,
          is_community: false,
          community_rank: 1,
        })),
        ...communityRows.map((c) => ({
          id: c.id,
          name: c.organization_name,
          blood_group: null,
          internal_lat:c.location_lat,internal_lng:c.location_lng,
          location_city: c.location_city,
          location_country: c.location_country,
          mobile: c.mobile,
          verification_status: c.verification_status,
          hemoglobin: null,
          last_donation_date: null,
          source_type: 'COMMUNITY' as const,
          created_at: c.created_at,
          sort_at: c.created_at,
          is_community: true,
          community_rank: 1,
        })),
      ].sort((a,b)=>compareDonors(a,b,orderContext));

      const slice = merged.slice(safeOffset, safeOffset + limit + 1);
      const hasMore = slice.length > limit;
      const data = slice.slice(0, limit);
      const publicData = data.map(({internal_lat,internal_lng,...row})=>row);
      const total = userCount + manualCount + communityCount;
      const globalTotal = globalCounts.total;

      return NextResponse.json({
        success: true,
        data: publicData,
        pagination: {
          limit,
          nextCursor: hasMore ? String(safeOffset + limit) : null,
          total,
        },
        meta: {
          globalTotal,
          fallback: true,
          ...(expand?{expanded:true,priorityCountry:selectedCountry||'',priorityCity:viewerCity||''}:{}),
        },
      }, { headers: freshDonorHeaders });
    } catch (fallbackError) {
      return NextResponse.json({ success: false, message: 'Failed to fetch donors.' }, { status: 500 });
    }
  }
}
