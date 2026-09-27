import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { initSocketServer } from './sockets';
import { logger } from './lib/logger';

async function main(): Promise<void> {
  const app = createApp();
  const httpServer = http.createServer(app);

  initSocketServer(httpServer);

  // Start listening immediately so Render's health check passes
  // DB connection happens after — routes will return 503 until ready
  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, () => {
      logger.info(`SeatMate API listening on port ${env.PORT} (${env.NODE_ENV})`);
      resolve();
    });
  });

  await connectDatabase();

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Fatal error during startup', error);
  process.exit(1);
});
