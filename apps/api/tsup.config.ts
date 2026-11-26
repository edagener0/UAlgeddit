import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { main: 'src/main.ts', seed: 'prisma/seed.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  clean: true,
  // The shared workspace package ships TypeScript sources, so bundle it in.
  noExternal: ['@ualgeddit/shared'],
});
