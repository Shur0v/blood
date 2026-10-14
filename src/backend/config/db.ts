import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { getDatabaseEnv } from './env';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

export const getPrisma = (): PrismaClient => {
  if (!prismaClient) {
    const env = getDatabaseEnv();
    const connectionString = env.DATABASE_URL;

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    prismaClient = new PrismaClient({
      adapter,
      log: [],
    });

    if (env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient;
    }
  }

  return prismaClient;
};
