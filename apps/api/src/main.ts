import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createContainer } from './container.js';
import { createLogger } from './lib/logger.js';
import { createPrismaClient } from './lib/prisma.js';

async function bootstrap() {
  const env = loadEnv();
  const logger = createLogger(env);
  const db = createPrismaClient(env.DATABASE_URL);
  await db.$connect();

  const container = createContainer(env, db, logger);
  const app = createApp(env, container, logger);
  const server = createServer(app);
  container.chatGateway.attach(server);

  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (docs at /api/docs)`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    container.chatGateway.close();
    server.close(async () => {
      await db.$disconnect();
      process.exit(0);
    });
    // Force exit if connections refuse to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
