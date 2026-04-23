import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../config/db';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value.trim();
};

async function main() {
  const adminId = requireEnv('ADMIN_ID');
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const adminRole = (process.env.ADMIN_ROLE || 'ADMIN').trim().toUpperCase();

  if (!['ADMIN', 'MANAGER'].includes(adminRole)) {
    throw new Error('ADMIN_ROLE must be either ADMIN or MANAGER');
  }

  const password = await bcrypt.hash(adminPassword, 12);
  const prisma = getPrisma();

  const admin = await prisma.adminUser.upsert({
    where: { admin_id: adminId },
    update: { password, role: adminRole },
    create: {
      admin_id: adminId,
      password,
      role: adminRole,
    },
  });

  console.log(`Admin user ready: ${admin.admin_id} (${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
