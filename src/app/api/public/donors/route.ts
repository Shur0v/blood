import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(16).default(16),
  cursor: z.string().optional(),
  bloodGroup: z.string().min(1).max(10).optional(),
  search: z.string().min(1).max(120).optional(),
  viewerCity: z.string().min(1).max(120).optional(),
  viewerCountry: z.string().min(1).max(120).optional(),
  country: z.string().min(1).max(120).optional(),
});

interface PublicDonorRow {
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
      viewerCountry: url.searchParams.get('viewerCountry') || undefined,
      country: url.searchParams.get('country') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { limit, cursor, bloodGroup, search, viewerCity, viewerCountry, country } = parsed.data;
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
    const shouldShowCommunity = !bloodGroup || hasCommunityKeyword;
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
      : Prisma.sql`1`;
    const serviceCityViewerCityRank = normalizedViewerCity
      ? Prisma.sql`CASE WHEN LOWER(usc.city) = LOWER(${normalizedViewerCity}) THEN 0 ELSE 1 END`
      : Prisma.sql`1`;
    const serviceCityViewerCountryRank = normalizedViewerCountry
      ? Prisma.sql`CASE WHEN LOWER(usc.country) = LOWER(${normalizedViewerCountry}) THEN 0 ELSE 1 END`
      : Prisma.sql`1`;
    const donorViewerCityRank = normalizedViewerCity
      ? Prisma.sql`CASE WHEN LOWER(donors.location_city) = LOWER(${normalizedViewerCity}) THEN 0 ELSE 1 END`
      : Prisma.sql`1`;
    const donorViewerCountryRank = normalizedViewerCountry
      ? Prisma.sql`CASE WHEN LOWER(donors.location_country) = LOWER(${normalizedViewerCountry}) THEN 0 ELSE 1 END`
      : Prisma.sql`1`;

    const rows = await prisma.$queryRaw<PublicDonorRow[]>(Prisma.sql`
      SELECT *
      FROM (
        SELECT
          u.id,
          u.name,
          u.blood_group,
          COALESCE(sc.city, u.location_city) AS location_city,
          COALESCE(sc.country, u.location_country) AS location_country,
          u.mobile,
          u.verification_status,
          CASE
            WHEN u.health_data IS NULL THEN NULL
            ELSE u.health_data ->> 'hemoglobin'
          END AS hemoglobin,
          u.last_donation_date,
          'REGISTERED'::text AS source_type,
          u.created_at,
          GREATEST(u.created_at, u.updated_at) AS sort_at,
          FALSE AS is_community,
          1 AS community_rank
        FROM "User" u
        LEFT JOIN LATERAL (
          SELECT usc.city, usc.country
          FROM "UserServiceCity" usc
          WHERE usc.user_id = u.id
          ORDER BY
            ${serviceCitySearchRank} ASC,
            ${serviceCityViewerCityRank} ASC,
            ${serviceCityViewerCountryRank} ASC,
            usc.created_at ASC
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
        ${shouldShowCommunity ? Prisma.empty : Prisma.sql`AND FALSE`}
        ${communityFilterByCountry}
        ${communityFilterBySearch}
      ) AS donors
      ORDER BY
        CASE
          WHEN ${hasCommunityKeyword} AND donors.is_community THEN 0
          WHEN donors.is_community AND donors.community_rank = 0 THEN 0
          WHEN donors.is_community AND donors.community_rank = 2 THEN 2
          WHEN donors.is_community THEN 1
          ELSE 1
        END ASC,
        ${donorViewerCityRank} ASC,
        ${donorViewerCountryRank} ASC,
        donors.location_country ASC,
        donors.sort_at DESC
      LIMIT ${limit + 1}
      OFFSET ${safeOffset}
    `);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    const publicData = data;

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
         ${shouldShowCommunity ? Prisma.empty : Prisma.sql`AND FALSE`}
         ${communityFilterByCountry}
         ${communityFilterBySearch}
        )
      ) AS total
    `);

    const totalValue = totalRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue);

    const globalRows = await prisma.$queryRaw<CountRow[]>`
      SELECT (
        (SELECT COUNT(*) FROM "User" u WHERE u.is_active_donor = true)
        +
        (SELECT COUNT(*) FROM "ManualBloodDonor" mbd WHERE mbd.is_active_donor = true)
        +
        (SELECT COUNT(*) FROM "CommunityDonor" cd WHERE cd.is_active = true)
      ) AS total
    `;
    const globalValue = globalRows[0]?.total ?? 0;
    const globalTotal = typeof globalValue === 'bigint' ? Number(globalValue) : Number(globalValue);

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
      },
    });
  } catch (error) {
    try {
      const url = new URL(req.url);
      const parsed = QuerySchema.safeParse({
        limit: url.searchParams.get('limit') || '16',
        cursor: url.searchParams.get('cursor') || undefined,
        bloodGroup: url.searchParams.get('bloodGroup') || undefined,
        search: url.searchParams.get('search') || undefined,
        viewerCity: url.searchParams.get('viewerCity') || undefined,
        viewerCountry: url.searchParams.get('viewerCountry') || undefined,
        country: url.searchParams.get('country') || undefined,
      });

      if (!parsed.success) {
        return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
      }

      const { limit, cursor, bloodGroup, search, viewerCity, viewerCountry, country } = parsed.data;
      const offset = cursor ? Number.parseInt(cursor, 10) : 0;
      const safeOffset = Number.isNaN(offset) || offset < 0 ? 0 : offset;
      const q = search?.trim();
      const qLower = q?.toLowerCase() || '';
      const isCommunitySearchOnly = qLower === 'community';
      const hasCommunityKeyword = qLower.includes('community');
      const communityCountryHint = hasCommunityKeyword ? qLower.replace('community', '').trim() : '';
      const normalizedViewerCity = viewerCity?.trim().toLowerCase();
      const normalizedViewerCountry = viewerCountry?.trim().toLowerCase();
      const normalizedCountry = country?.trim();

      const prisma = getPrisma();
      const userWhere = {
        is_active_donor: true,
        ...(normalizedCountry
          ? {
              OR: [
                { location_country: { equals: normalizedCountry, mode: 'insensitive' as const } },
                { ServiceCities: { some: { country: { equals: normalizedCountry, mode: 'insensitive' as const } } } },
              ],
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
      const shouldShowCommunity = !bloodGroup || hasCommunityKeyword;
      const communityWhere = {
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

      const [users, manualRows, communityRows, userCount, manualCount, communityCount, globalUserCount, globalManualCount, globalCommunityCount] = await Promise.all([
        prisma.user.findMany({ where: userWhere, orderBy: { updated_at: 'desc' }, take: limit + safeOffset + 1 }),
        prisma.manualBloodDonor.findMany({ where: manualWhere, orderBy: { created_at: 'desc' }, take: limit + safeOffset + 1 }),
        shouldShowCommunity
          ? prisma.communityDonor.findMany({ where: communityWhere, orderBy: { created_at: 'desc' }, take: limit + safeOffset + 8 })
          : Promise.resolve([]),
        prisma.user.count({ where: userWhere }),
        prisma.manualBloodDonor.count({ where: manualWhere }),
        shouldShowCommunity ? prisma.communityDonor.count({ where: communityWhere }) : Promise.resolve(0),
        prisma.user.count({ where: { is_active_donor: true } }),
        prisma.manualBloodDonor.count({ where: { is_active_donor: true } }),
        prisma.communityDonor.count({ where: { is_active: true } }),
      ]);

      const merged = [
        ...users.map((u) => ({
          id: u.id,
          name: u.name,
          blood_group: u.blood_group,
          location_city: u.location_city,
          location_country: u.location_country,
          mobile: u.mobile,
          verification_status: u.verification_status,
          hemoglobin:
            u.health_data && typeof u.health_data === 'object' && 'hemoglobin' in (u.health_data as Record<string, unknown>)
              ? String((u.health_data as Record<string, unknown>).hemoglobin ?? '')
              : null,
          last_donation_date: u.last_donation_date,
          source_type: 'REGISTERED' as const,
          created_at: u.created_at,
          sort_at: u.updated_at,
          is_community: false,
          community_rank: 1,
        })),
        ...manualRows.map((m) => ({
          id: m.id,
          name: m.name || 'BloodNet Donor',
          blood_group: m.blood_group,
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
      ].sort((a, b) => {
        if (hasCommunityKeyword) {
          if (a.source_type === 'COMMUNITY' && b.source_type !== 'COMMUNITY') return -1;
          if (a.source_type !== 'COMMUNITY' && b.source_type === 'COMMUNITY') return 1;
        }
        let aCityRank = 1, bCityRank = 1;
        let aCountryRank = 1, bCountryRank = 1;

        if (normalizedViewerCity) {
          if (a.location_city?.toLowerCase() === normalizedViewerCity) aCityRank = 0;
          if (b.location_city?.toLowerCase() === normalizedViewerCity) bCityRank = 0;
        }

        if (normalizedViewerCountry) {
          if (a.location_country?.toLowerCase() === normalizedViewerCountry) aCountryRank = 0;
          if (b.location_country?.toLowerCase() === normalizedViewerCountry) bCountryRank = 0;
        }

        if (aCityRank !== bCityRank) return aCityRank - bCityRank;
        if (aCountryRank !== bCountryRank) return aCountryRank - bCountryRank;
        
        const countryCompare = (a.location_country || '').localeCompare(b.location_country || '');
        if (countryCompare !== 0) return countryCompare;

        return b.sort_at.getTime() - a.sort_at.getTime();
      });

      const slice = merged.slice(safeOffset, safeOffset + limit + 1);
      const hasMore = slice.length > limit;
      const data = slice.slice(0, limit);
      const publicData = data;
      const total = userCount + manualCount + communityCount;
      const globalTotal = globalUserCount + globalManualCount + globalCommunityCount;

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
        },
      });
    } catch (fallbackError) {
      return NextResponse.json({ success: false, message: 'Failed to fetch donors.' }, { status: 500 });
    }
  }
}
