import { cache } from 'react';
import { getPrisma } from '../config/db';

// Match the public blood directory: count active entries once per source row,
// not once per service city. Read all sources from the same database snapshot.
export const getActiveBloodDonorCounts = cache(async () => {
  const prisma = getPrisma();
  const [registered, manual, community] = await prisma.$transaction([
    prisma.user.count({ where: { is_active_donor: true } }),
    prisma.manualBloodDonor.count({ where: { is_active_donor: true } }),
    prisma.communityDonor.count({ where: { is_active: true } }),
  ], { isolationLevel: 'RepeatableRead' });
  return { registered, manual, community, total: registered + manual + community };
});

export async function getBloodCountryEntryCount(country:string){
  const rows=await getPrisma().$queryRaw<Array<{total:number}>>`
    SELECT COUNT(DISTINCT donor_key)::int AS total FROM (
      SELECT 'user:'||u.id AS donor_key FROM "User" u WHERE u.is_active_donor=true
      AND (LOWER(TRIM(u.location_country))=LOWER(TRIM(${country})) OR EXISTS(SELECT 1 FROM "UserServiceCity" sc WHERE sc.user_id=u.id AND LOWER(TRIM(sc.country))=LOWER(TRIM(${country}))))
      UNION ALL SELECT 'manual:'||id FROM "ManualBloodDonor" WHERE is_active_donor=true AND LOWER(TRIM(location_country))=LOWER(TRIM(${country}))
      UNION ALL SELECT 'community:'||id FROM "CommunityDonor" WHERE is_active=true AND LOWER(TRIM(location_country))=LOWER(TRIM(${country}))
    ) entries`;
  return rows[0]?.total||0;
}
