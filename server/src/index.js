import fs from 'node:fs';
import { createApp } from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { UPLOADS_DIR } from './services/storage.service.js';

async function bootstrap() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `\n  CivicFix API ready\n  → http://localhost:${env.port}/api/health\n  → environment: ${env.nodeEnv}\n  → storage driver: ${env.storageDriver}\n`,
    );
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n[civicfix] ${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(0), 8000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) =>
    process.on(signal, () => shutdown(signal)),
  );

  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[civicfix] Unhandled promise rejection:', reason);
  });

  return server;
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[civicfix] Failed to start the API:', error);
  process.exit(1);
});
