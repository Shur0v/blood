import { getPrisma } from '../config/db';

// Match the public blood directory: count active entries once per source row,
// not once per service city. Read all sources from the same database snapshot.
export async function getActiveBloodDonorCounts() {
  const prisma = getPrisma();
  const [registered, manual, community] = await prisma.$transaction([
    prisma.user.count({ where: { is_active_donor: true } }),
    prisma.manualBloodDonor.count({ where: { is_active_donor: true } }),
    prisma.communityDonor.count({ where: { is_active: true } }),
  ], { isolationLevel: 'RepeatableRead' });
  return { registered, manual, community, total: registered + manual + community };
}
