import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  search: z.string().optional(),
});

type RegionAggRow = {
  country: string;
  city: string;
  total_users: bigint | number;
  active_users: bigint | number;
  inactive_users: bigint | number;
  pending_reviews: bigint | number;
  blood_count: bigint | number;
  organ_count: bigint | number;
  current_signups: bigint | number;
  previous_signups: bigint | number;
};

type TopDensityRow = {
  country: string;
  total_users: bigint | number;
};

type TopGrowthRow = {
  country: string;
  city: string;
  current_signups: bigint | number;
  previous_signups: bigint | number;
};

const toNumber = (value: bigint | number | null | undefined): number => {
  if (typeof value === 'bigint') return Number(value);
  return Number(value ?? 0);
};

const formatGrowth = (current: number, previous: number): string => {
  if (previous <= 0) {
    return current > 0 ? '+100%' : '+0%';
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
};

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '20',
      search: url.searchParams.get('search') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { page, limit, search } = parsed.data;
    const prisma = getPrisma();
    const offset = (page - 1) * limit;
    const hasSearch = Boolean(search?.trim());
    const searchLike = hasSearch ? `%${search!.trim()}%` : null;

    const searchClause = hasSearch
      ? Prisma.sql`WHERE r.country ILIKE ${searchLike} OR r.city ILIKE ${searchLike}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<RegionAggRow[]>`
      WITH registered_user_regions AS (
        SELECT
          u.id AS user_id,
          u.location_country AS country,
          u.location_city AS city,
          u.is_active_donor,
          u.verification_status,
          u.created_at
        FROM "User" u
        UNION
        SELECT
          u.id AS user_id,
          usc.country AS country,
          usc.city AS city,
          u.is_active_donor,
          u.verification_status,
          u.created_at
        FROM "UserServiceCity" usc
        INNER JOIN "User" u ON u.id = usc.user_id
      ),
      user_regions AS (
        SELECT
          rur.country,
          rur.city,
          COUNT(DISTINCT rur.user_id)::bigint AS total_users,
          COUNT(DISTINCT rur.user_id) FILTER (WHERE rur.is_active_donor = true)::bigint AS active_users,
          COUNT(DISTINCT rur.user_id) FILTER (WHERE rur.is_active_donor = false)::bigint AS inactive_users,
          COUNT(DISTINCT rur.user_id) FILTER (WHERE rur.verification_status = 'PENDING')::bigint AS pending_reviews,
          COUNT(DISTINCT rur.user_id) FILTER (WHERE rur.created_at >= NOW() - INTERVAL '30 days')::bigint AS current_signups,
          COUNT(DISTINCT rur.user_id) FILTER (
            WHERE rur.created_at >= NOW() - INTERVAL '60 days' AND rur.created_at < NOW() - INTERVAL '30 days'
          )::bigint AS previous_signups
        FROM registered_user_regions rur
        GROUP BY rur.country, rur.city
      ),
      manual_blood AS (
        SELECT
          mbd.location_country AS country,
          mbd.location_city AS city,
          COUNT(*) FILTER (WHERE mbd.is_active_donor = true)::bigint AS blood_count
        FROM "ManualBloodDonor" mbd
        GROUP BY mbd.location_country, mbd.location_city
      ),
      user_organ AS (
        SELECT
          rur.country,
          rur.city,
          COUNT(DISTINCT rur.user_id)::bigint AS organ_count
        FROM registered_user_regions rur
        INNER JOIN "OrganPledge" op ON op.user_id = rur.user_id
        WHERE op.is_active = true
        GROUP BY rur.country, rur.city
      ),
      manual_organ AS (
        SELECT
          mod.location_country AS country,
          mod.location_city AS city,
          COUNT(*)::bigint AS organ_count
        FROM "ManualOrganDonor" mod
        GROUP BY mod.location_country, mod.location_city
      ),
      regions AS (
        SELECT
          ur.country,
          ur.city,
          ur.total_users,
          ur.active_users,
          ur.inactive_users,
          ur.pending_reviews,
          ur.current_signups,
          ur.previous_signups,
          (ur.active_users + COALESCE(mb.blood_count, 0))::bigint AS blood_count,
          (COALESCE(uo.organ_count, 0) + COALESCE(mo.organ_count, 0))::bigint AS organ_count
        FROM user_regions ur
        LEFT JOIN manual_blood mb ON mb.country = ur.country AND mb.city = ur.city
        LEFT JOIN user_organ uo ON uo.country = ur.country AND uo.city = ur.city
        LEFT JOIN manual_organ mo ON mo.country = ur.country AND mo.city = ur.city
      )
      SELECT
        r.country,
        r.city,
        r.total_users,
        r.active_users,
        r.inactive_users,
        r.pending_reviews,
        r.blood_count,
        r.organ_count,
        r.current_signups,
        r.previous_signups
      FROM regions r
      ${searchClause}
      ORDER BY r.total_users DESC, r.country ASC, r.city ASC
      OFFSET ${offset}
      LIMIT ${limit};
    `;

    const totalResult = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
      WITH registered_user_regions AS (
        SELECT
          u.id AS user_id,
          u.location_country AS country,
          u.location_city AS city
        FROM "User" u
        UNION
        SELECT
          usc.user_id,
          usc.country,
          usc.city
        FROM "UserServiceCity" usc
      ),
      regions AS (
        SELECT country, city
        FROM registered_user_regions
        GROUP BY country, city
      )
      SELECT COUNT(*)::bigint AS total
      FROM regions r
      ${
        hasSearch
          ? Prisma.sql`WHERE r.country ILIKE ${searchLike} OR r.city ILIKE ${searchLike}`
          : Prisma.empty
      };
    `;

    const globalResult = await prisma.$queryRaw<
      Array<{ countries: bigint | number; cities: bigint | number }>
    >`
      WITH registered_user_regions AS (
        SELECT
          u.id AS user_id,
          u.location_country AS country,
          u.location_city AS city
        FROM "User" u
        UNION
        SELECT
          usc.user_id,
          usc.country,
          usc.city
        FROM "UserServiceCity" usc
      )
      SELECT
        COUNT(DISTINCT rur.country)::bigint AS countries,
        COUNT(DISTINCT CONCAT(rur.country, '||', rur.city))::bigint AS cities
      FROM registered_user_regions rur;
    `;

    const densityResult = await prisma.$queryRaw<TopDensityRow[]>`
      WITH registered_user_regions AS (
        SELECT
          u.id AS user_id,
          u.location_country AS country,
          u.location_city AS city
        FROM "User" u
        UNION
        SELECT
          usc.user_id,
          usc.country,
          usc.city
        FROM "UserServiceCity" usc
      )
      SELECT
        rur.country,
        COUNT(DISTINCT rur.user_id)::bigint AS total_users
      FROM registered_user_regions rur
      GROUP BY rur.country
      ORDER BY total_users DESC, rur.country ASC
      LIMIT 1;
    `;

    const growthResult = await prisma.$queryRaw<TopGrowthRow[]>`
      WITH registered_user_regions AS (
        SELECT
          u.id AS user_id,
          u.location_country AS country,
          u.location_city AS city,
          u.created_at
        FROM "User" u
        UNION
        SELECT
          u.id AS user_id,
          usc.country AS country,
          usc.city AS city,
          u.created_at
        FROM "UserServiceCity" usc
        INNER JOIN "User" u ON u.id = usc.user_id
      )
      SELECT
        rur.country,
        rur.city,
        COUNT(DISTINCT rur.user_id) FILTER (WHERE rur.created_at >= NOW() - INTERVAL '30 days')::bigint AS current_signups,
        COUNT(DISTINCT rur.user_id) FILTER (
          WHERE rur.created_at >= NOW() - INTERVAL '60 days' AND rur.created_at < NOW() - INTERVAL '30 days'
        )::bigint AS previous_signups
      FROM registered_user_regions rur
      GROUP BY rur.country, rur.city
      ORDER BY current_signups DESC, rur.country ASC, rur.city ASC
      LIMIT 1;
    `;

    const mappedRows = rows.map((row) => {
      const current = toNumber(row.current_signups);
      const previous = toNumber(row.previous_signups);
      return {
        id: `${row.country}::${row.city}`,
        country: row.country,
        city: row.city,
        total: toNumber(row.total_users),
        active: toNumber(row.active_users),
        inactive: toNumber(row.inactive_users),
        blood: toNumber(row.blood_count),
        organ: toNumber(row.organ_count),
        pending: toNumber(row.pending_reviews),
        growth: formatGrowth(current, previous),
      };
    });

    const total = toNumber(totalResult[0]?.total ?? 0);
    const countries = toNumber(globalResult[0]?.countries ?? 0);
    const cities = toNumber(globalResult[0]?.cities ?? 0);
    const topDensityCountry = densityResult[0]?.country ?? 'N/A';
    const topDensityTotal = toNumber(densityResult[0]?.total_users ?? 0);
    const topGrowthCountry = growthResult[0]?.country ?? 'N/A';
    const topGrowthCity = growthResult[0]?.city ?? 'N/A';
    const topGrowthLabel = formatGrowth(
      toNumber(growthResult[0]?.current_signups ?? 0),
      toNumber(growthResult[0]?.previous_signups ?? 0),
    );

    return NextResponse.json({
      success: true,
      data: mappedRows,
      meta: {
        globalReach: countries,
        totalHubs: cities,
        highestDensity: {
          country: topDensityCountry,
          users: topDensityTotal,
        },
        topGrowthZone: {
          city: topGrowthCity,
          country: topGrowthCountry,
          growth: topGrowthLabel,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch regional analytics.' }, { status: 500 });
  }
}
