import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { normalizeOrganName } from '@/src/lib/organCatalog';

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(16).default(16),
  cursor: z.string().optional(),
  organ: z.string().min(1).max(80).optional(),
  bloodGroup: z.string().min(1).max(10).optional(),
  search: z.string().min(1).max(120).optional(),
  viewerCity: z.string().min(1).max(120).optional(),
  viewerCountry: z.string().min(1).max(120).optional(),
  country: z.string().min(1).max(120).optional(),
});

interface PublicOrganDonorRow {
  id: string;
  name: string;
  blood_group: string | null;
  organ_type: string;
  location_city: string;
  location_country: string;
  mobile: string;
  verification_status: string | null;
  hemoglobin: string | null;
  last_donation_date: Date | null;
  source_type: 'REGISTERED' | 'MANUAL';
  created_at: Date;
  sort_at: Date;
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
      organ: url.searchParams.get('organ') || undefined,
      bloodGroup: url.searchParams.get('bloodGroup') || undefined,
      search: url.searchParams.get('search') || undefined,
      viewerCity: url.searchParams.get('viewerCity') || undefined,
      viewerCountry: url.searchParams.get('viewerCountry') || undefined,
      country: url.searchParams.get('country') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { limit, cursor, organ, bloodGroup, search, viewerCity, viewerCountry, country } = parsed.data;
    const normalizedOrganFilter = organ ? normalizeOrganName(organ) : null;
    if (organ && !normalizedOrganFilter) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { limit, nextCursor: null, total: 0 },
        meta: { globalTotal: 0 },
      });
    }
    const offset = cursor ? Number.parseInt(cursor, 10) : 0;
    const safeOffset = Number.isNaN(offset) || offset < 0 ? 0 : offset;
    const normalizedSearch = search?.trim();
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
      ? Prisma.sql`AND LOWER(mod.location_country) = LOWER(${normalizedCountry})`
      : Prisma.empty;

    const prisma = getPrisma();

    const normalizedUserOrgan = Prisma.sql`CASE
      WHEN LOWER(TRIM(op.organ_type)) IN ('kidney', 'kidneys') THEN 'Kidney'
      WHEN LOWER(TRIM(op.organ_type)) IN ('liver') THEN 'Liver'
      WHEN LOWER(TRIM(op.organ_type)) IN ('lung', 'lungs') THEN 'Lung'
      WHEN LOWER(TRIM(op.organ_type)) IN ('pancreas') THEN 'Pancreas'
      WHEN LOWER(TRIM(op.organ_type)) IN ('intestine', 'small intestine') THEN 'Intestine'
      WHEN LOWER(TRIM(op.organ_type)) IN ('eye', 'eyes', 'cornea', 'corneas', 'corneas (eyes)') THEN 'Eye'
      WHEN LOWER(TRIM(op.organ_type)) IN ('sperm', 'sparm', 'semen') THEN 'Sperm'
      ELSE NULL
    END`;
    const userFilterByOrgan = normalizedOrganFilter ? Prisma.sql`AND ${normalizedUserOrgan} = ${normalizedOrganFilter}` : Prisma.empty;
    const userFilterByBlood = bloodGroup ? Prisma.sql`AND u.blood_group = ${bloodGroup}` : Prisma.empty;
    const manualFilterByBlood = bloodGroup ? Prisma.sql`AND mod.blood_group = ${bloodGroup}` : Prisma.empty;
    const normalizedManualOrgan = Prisma.sql`CASE
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('kidney', 'kidneys') THEN 'Kidney'
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('liver') THEN 'Liver'
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('lung', 'lungs') THEN 'Lung'
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('pancreas') THEN 'Pancreas'
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('intestine', 'small intestine') THEN 'Intestine'
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('eye', 'eyes', 'cornea', 'corneas', 'corneas (eyes)') THEN 'Eye'
      WHEN LOWER(TRIM(mo.organ_raw)) IN ('sperm', 'sparm', 'semen') THEN 'Sperm'
      ELSE NULL
    END`;
    const manualFilterByOrgan = normalizedOrganFilter ? Prisma.sql`AND ${normalizedManualOrgan} = ${normalizedOrganFilter}` : Prisma.empty;
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
            COALESCE(mod.name, 'Manual Organ Donor') ILIKE ${searchLike}
            OR mod.location_city ILIKE ${searchLike}
            OR mod.location_country ILIKE ${searchLike}
            OR mod.mobile ILIKE ${searchLike}
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
      ? Prisma.sql`CASE WHEN LOWER(organ_donors.location_city) = LOWER(${normalizedViewerCity}) THEN 0 ELSE 1 END`
      : Prisma.sql`1`;
    const donorViewerCountryRank = normalizedViewerCountry
      ? Prisma.sql`CASE WHEN LOWER(organ_donors.location_country) = LOWER(${normalizedViewerCountry}) THEN 0 ELSE 1 END`
      : Prisma.sql`1`;

    const rows = await prisma.$queryRaw<PublicOrganDonorRow[]>(Prisma.sql`
      SELECT *
      FROM (
        SELECT
          u.id,
          u.name,
          u.blood_group,
          ${normalizedUserOrgan} AS organ_type,
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
          op.created_at,
          op.updated_at AS sort_at
        FROM "OrganPledge" op
        JOIN "User" u ON u.id = op.user_id
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
        WHERE op.is_active = true AND u.is_active_donor = true
          AND ${normalizedUserOrgan} IS NOT NULL
        ${userFilterByCountry}
        ${userFilterByOrgan}
        ${userFilterByBlood}
        ${userFilterBySearch}

        UNION ALL

        SELECT
          mod.id,
          COALESCE(mod.name, 'Manual Organ Donor') AS name,
          mod.blood_group,
          ${normalizedManualOrgan} AS organ_type,
          mod.location_city,
          mod.location_country,
          mod.mobile,
          NULL::text AS verification_status,
          NULL::text AS hemoglobin,
          NULL::timestamp AS last_donation_date,
          'MANUAL'::text AS source_type,
          mod.created_at,
          mod.created_at AS sort_at
        FROM "ManualOrganDonor" mod
        CROSS JOIN LATERAL (
          SELECT value AS organ_raw
          FROM regexp_split_to_table(mod.organ_type, ',') AS value
        ) mo
        WHERE TRIM(mo.organ_raw) <> ''
          AND ${normalizedManualOrgan} IS NOT NULL
        ${manualFilterByCountry}
        ${manualFilterByOrgan}
        ${manualFilterByBlood}
        ${manualFilterBySearch}
      ) AS organ_donors
      ORDER BY
        ${donorViewerCityRank} ASC,
        ${donorViewerCountryRank} ASC,
        organ_donors.sort_at DESC
      LIMIT ${limit + 1}
      OFFSET ${safeOffset}
    `);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    const totalRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT (
        (SELECT COUNT(*)
         FROM "OrganPledge" op
         JOIN "User" u ON u.id = op.user_id
         WHERE op.is_active = true AND u.is_active_donor = true
         ${userFilterByCountry}
         ${userFilterByOrgan}
         ${userFilterByBlood}
         ${userFilterBySearch}
        )
        +
        (SELECT COUNT(*)
         FROM "ManualOrganDonor" mod
         CROSS JOIN LATERAL (
          SELECT value AS organ_raw
          FROM regexp_split_to_table(mod.organ_type, ',') AS value
         ) mo
         WHERE TRIM(mo.organ_raw) <> ''
           AND ${normalizedManualOrgan} IS NOT NULL
         ${manualFilterByCountry}
         ${manualFilterByOrgan}
         ${manualFilterByBlood}
         ${manualFilterBySearch}
        )
      ) AS total
    `);

    const totalValue = totalRows[0]?.total ?? 0;
    const total = typeof totalValue === 'bigint' ? Number(totalValue) : Number(totalValue);

    const globalRows = await prisma.$queryRaw<CountRow[]>`
      SELECT (
        (SELECT COUNT(*) FROM "OrganPledge" op JOIN "User" u ON u.id = op.user_id WHERE op.is_active = true AND u.is_active_donor = true)
        +
        (
          SELECT COUNT(*)
          FROM "ManualOrganDonor" mod
          CROSS JOIN LATERAL (
            SELECT value AS organ_raw
            FROM regexp_split_to_table(mod.organ_type, ',') AS value
          ) mo
          WHERE TRIM(mo.organ_raw) <> ''
        )
      ) AS total
    `;
    const globalValue = globalRows[0]?.total ?? 0;
    const globalTotal = typeof globalValue === 'bigint' ? Number(globalValue) : Number(globalValue);

    return NextResponse.json({
      success: true,
      data,
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
    return NextResponse.json({ success: false, message: 'Failed to fetch organ donors.' }, { status: 500 });
  }
}
