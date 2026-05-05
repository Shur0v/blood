import { Prisma } from "@prisma/client";
import { getPrisma } from "@/src/backend/config/db";
import { BLOOD_GROUPS, type BloodGroup, cityToSlug, organFromSlug, organToSlug } from "@/src/lib/seoRouting";
import { normalizeOrganName } from "@/src/lib/organCatalog";

export interface PublicDonorSeoRow {
  id: string;
  name: string;
  blood_group: string;
  location_city: string;
  location_country: string;
  mobile: string | null;
  verification_status: string | null;
  last_donation_date: Date | null;
  source_type: "REGISTERED" | "MANUAL";
  updated_at: Date;
}

export interface CityBloodCount {
  city: string;
  country: string;
  blood_group: string;
  total: bigint | number;
  updated_at: Date | null;
}

export interface OrganSeoRow {
  id: string;
  name: string;
  organ_type: string;
  blood_group: string | null;
  location_city: string;
  location_country: string;
  mobile: string | null;
  source_type: "REGISTERED" | "MANUAL";
  updated_at: Date;
}

export interface OrganRequestSeoRow {
  id: string;
  name: string;
  contact: string | null;
  organ_type: string;
  location_city: string;
  location_country: string;
  medical_note: string | null;
  status: string;
  created_at: Date;
  updated_at?: Date | null;
}

const toNumber = (value: bigint | number | string | null | undefined) => Number(value ?? 0);

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

export const getBloodDonorsByGroupAndCity = async (bloodGroup: BloodGroup, citySlug: string) => {
  const prisma = getPrisma();
  return prisma.$queryRaw<PublicDonorSeoRow[]>(Prisma.sql`
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
        u.last_donation_date,
        'REGISTERED'::text AS source_type,
        GREATEST(u.created_at, u.updated_at) AS updated_at
      FROM "User" u
      LEFT JOIN LATERAL (
        SELECT usc.city, usc.country
        FROM "UserServiceCity" usc
        WHERE usc.user_id = u.id AND LOWER(REPLACE(usc.city, ' ', '-')) = ${citySlug}
        ORDER BY usc.created_at ASC
        LIMIT 1
      ) sc ON TRUE
      WHERE u.is_active_donor = true
        AND u.blood_group = ${bloodGroup}
        AND LOWER(REPLACE(COALESCE(sc.city, u.location_city), ' ', '-')) = ${citySlug}

      UNION ALL

      SELECT
        mbd.id,
        COALESCE(mbd.name, 'Manual Donor') AS name,
        mbd.blood_group,
        mbd.location_city,
        mbd.location_country,
        mbd.mobile,
        mbd.verification_status,
        mbd.last_donation_date,
        'MANUAL'::text AS source_type,
        mbd.created_at AS updated_at
      FROM "ManualBloodDonor" mbd
      WHERE mbd.is_active_donor = true
        AND mbd.blood_group = ${bloodGroup}
        AND LOWER(REPLACE(mbd.location_city, ' ', '-')) = ${citySlug}
    ) donors
    ORDER BY donors.updated_at DESC
    LIMIT 48;
  `);
};

export const getBloodGroupCityCounts = async (): Promise<CityBloodCount[]> => {
  const prisma = getPrisma();
  return prisma.$queryRaw<CityBloodCount[]>`
    SELECT city, country, blood_group, SUM(total)::bigint AS total, MAX(updated_at) AS updated_at
    FROM (
      SELECT COALESCE(sc.city, u.location_city) AS city, COALESCE(sc.country, u.location_country) AS country, u.blood_group, COUNT(DISTINCT u.id)::bigint AS total, MAX(u.updated_at) AS updated_at
      FROM "User" u
      LEFT JOIN LATERAL (
        SELECT usc.city, usc.country FROM "UserServiceCity" usc WHERE usc.user_id = u.id ORDER BY usc.created_at ASC LIMIT 1
      ) sc ON TRUE
      WHERE u.is_active_donor = true
      GROUP BY COALESCE(sc.city, u.location_city), COALESCE(sc.country, u.location_country), u.blood_group
      UNION ALL
      SELECT mbd.location_city AS city, mbd.location_country AS country, mbd.blood_group, COUNT(*)::bigint AS total, MAX(mbd.created_at) AS updated_at
      FROM "ManualBloodDonor" mbd
      WHERE mbd.is_active_donor = true
      GROUP BY mbd.location_city, mbd.location_country, mbd.blood_group
    ) rows
    GROUP BY city, country, blood_group
    ORDER BY total DESC, country ASC, city ASC;
  `;
};

export const getCityBloodSummary = async (citySlug: string) => {
  const rows = await getBloodGroupCityCounts();
  return rows.filter((row) => cityToSlug(row.city) === citySlug);
};

export const getBloodGroupSummary = async (bloodGroup: BloodGroup) => {
  const rows = await getBloodGroupCityCounts();
  return rows.filter((row) => row.blood_group === bloodGroup);
};

export const getNetworkStats = async (country?: string, citySlug?: string) => {
  const rows = await getBloodGroupCityCounts();
  const filtered = rows.filter((row) => {
    if (country && row.country.toLowerCase() !== country.toLowerCase()) return false;
    if (citySlug && cityToSlug(row.city) !== citySlug) return false;
    return true;
  });
  const countries = new Set(filtered.map((row) => row.country));
  const cities = new Set(filtered.map((row) => `${row.country}::${row.city}`));
  const bloodGroups = new Set(filtered.map((row) => row.blood_group));
  return {
    totalDonors: filtered.reduce((sum, row) => sum + toNumber(row.total), 0),
    countries: countries.size,
    cities: cities.size,
    bloodGroups: Array.from(bloodGroups),
    rows: filtered,
    lastUpdated: filtered.reduce<Date | null>((latest, row) => {
      if (!row.updated_at) return latest;
      return !latest || row.updated_at > latest ? row.updated_at : latest;
    }, null),
  };
};

export const getOrganDonors = async (organSlug?: string, citySlug?: string) => {
  const organ = organSlug ? organFromSlug(organSlug) : null;
  const organFilter = organ ? Prisma.sql`AND organ_rows.organ_type = ${organ}` : Prisma.empty;
  const cityFilter = citySlug ? Prisma.sql`AND LOWER(REPLACE(organ_rows.location_city, ' ', '-')) = ${citySlug}` : Prisma.empty;
  const prisma = getPrisma();
  return prisma.$queryRaw<OrganSeoRow[]>(Prisma.sql`
    SELECT *
    FROM (
      SELECT u.id, u.name, ${normalizedUserOrgan} AS organ_type, u.blood_group, COALESCE(sc.city, u.location_city) AS location_city, COALESCE(sc.country, u.location_country) AS location_country, u.mobile, 'REGISTERED'::text AS source_type, GREATEST(op.created_at, op.updated_at) AS updated_at
      FROM "OrganPledge" op
      JOIN "User" u ON u.id = op.user_id
      LEFT JOIN LATERAL (
        SELECT usc.city, usc.country FROM "UserServiceCity" usc WHERE usc.user_id = u.id ORDER BY usc.created_at ASC LIMIT 1
      ) sc ON TRUE
      WHERE op.is_active = true AND u.is_active_donor = true AND ${normalizedUserOrgan} IS NOT NULL
      UNION ALL
      SELECT mod.id, COALESCE(mod.name, 'Manual Organ Donor') AS name, ${normalizedManualOrgan} AS organ_type, mod.blood_group, mod.location_city, mod.location_country, mod.mobile, 'MANUAL'::text AS source_type, mod.created_at AS updated_at
      FROM "ManualOrganDonor" mod
      CROSS JOIN LATERAL (SELECT value AS organ_raw FROM regexp_split_to_table(mod.organ_type, ',') AS value) mo
      WHERE TRIM(mo.organ_raw) <> '' AND ${normalizedManualOrgan} IS NOT NULL
    ) organ_rows
    WHERE 1=1
      ${organFilter}
      ${cityFilter}
    ORDER BY organ_rows.updated_at DESC
    LIMIT 48;
  `);
};

export const getVerifiedOrganRequests = async (organSlug?: string, citySlug?: string) => {
  const organ = organSlug ? organFromSlug(organSlug) : null;
  const prisma = getPrisma();
  return prisma.organRequest.findMany({
    where: {
      status: "VERIFIED",
      ...(organ ? { organ_type: { equals: organ, mode: "insensitive" as const } } : {}),
    },
    orderBy: { created_at: "desc" },
    take: 48,
  }).then((rows) =>
    rows.filter((row) => (!citySlug ? true : cityToSlug(row.location_city) === citySlug)) as OrganRequestSeoRow[],
  );
};

export const getVerifiedOrganRequestBySlug = async (slug: string) => {
  const rows = await getVerifiedOrganRequests();
  return rows.find((row) => buildOrganRequestSlug(row) === slug) ?? null;
};

export const buildOrganRequestSlug = (row: Pick<OrganRequestSeoRow, "id" | "organ_type" | "location_city" | "created_at">) => {
  const organSlug = organToSlug(row.organ_type) || cityToSlug(row.organ_type);
  const citySlug = cityToSlug(row.location_city);
  const year = row.created_at.getUTCFullYear();
  return `${organSlug}-request-${citySlug}-${year}-${row.id.slice(0, 8)}`;
};

export const getOrganTypesWithData = async () => {
  const [donors, requests] = await Promise.all([getOrganDonors(), getVerifiedOrganRequests()]);
  const slugs = new Set<string>();
  donors.forEach((row) => {
    const slug = organToSlug(row.organ_type);
    if (slug) slugs.add(slug);
  });
  requests.forEach((row) => {
    const slug = organToSlug(row.organ_type);
    if (slug) slugs.add(slug);
  });
  return Array.from(slugs);
};

export const getRelatedBloodGroups = (current: BloodGroup) => BLOOD_GROUPS.filter((group) => group !== current);

export const getPublicBotStats = async () => {
  const prisma = getPrisma();
  const [
    registeredUsers,
    activeRegisteredDonors,
    activeManualBloodDonors,
    manualOrganDonors,
    verifiedOrganRequests,
    cityRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { is_active_donor: true } }),
    prisma.manualBloodDonor.count({ where: { is_active_donor: true } }),
    prisma.manualOrganDonor.count(),
    prisma.organRequest.count({ where: { status: "VERIFIED" } }),
    prisma.$queryRaw<Array<{ city: string; country: string }>>`
      SELECT city, country FROM (
        SELECT u.location_city AS city, u.location_country AS country FROM "User" u WHERE u.is_active_donor = true
        UNION
        SELECT usc.city, usc.country FROM "UserServiceCity" usc
        JOIN "User" u ON u.id = usc.user_id
        WHERE u.is_active_donor = true
        UNION
        SELECT mbd.location_city AS city, mbd.location_country AS country FROM "ManualBloodDonor" mbd WHERE mbd.is_active_donor = true
        UNION
        SELECT mod.location_city AS city, mod.location_country AS country FROM "ManualOrganDonor" mod
      ) regions
    `,
  ]);

  return {
    registeredUsers,
    activeBloodDonors: activeRegisteredDonors + activeManualBloodDonors,
    organDonorEntries: manualOrganDonors,
    verifiedOrganRequests,
    activeCountries: new Set(cityRows.map((row) => row.country)).size,
    activeCities: new Set(cityRows.map((row) => `${row.country}::${row.city}`)).size,
    lastUpdated: new Date().toISOString(),
  };
};
