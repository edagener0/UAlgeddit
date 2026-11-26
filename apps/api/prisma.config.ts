import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read leniently: `prisma generate` (Docker build, CI) needs no database, while
    // commands that do (migrate, db seed) fail with an explicit connection error.
    url: process.env.DATABASE_URL ?? '',
  },
});
