import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export type Database = PrismaClient;

/** Transaction client handed to `prisma.$transaction(async (tx) => ...)` callbacks. */
export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/** Prisma 7 talks to PostgreSQL through the `pg` driver adapter. */
export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
