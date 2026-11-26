import { PrismaClient } from '@prisma/client';

export type Database = PrismaClient;

/** Transaction client handed to `prisma.$transaction(async (tx) => ...)` callbacks. */
export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export function createPrismaClient(url: string): PrismaClient {
  return new PrismaClient({ datasourceUrl: url });
}
