import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      LOG_LEVEL: 'silent',
      RATE_LIMIT_ENABLED: 'false',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.docs.ts', 'src/docs/**'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
