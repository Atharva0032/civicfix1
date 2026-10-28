import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import env, { SERVER_ROOT } from './env.js';

/**
 * Absolute path of the on-disk directory backing the local in-memory MongoDB.
 * Kept inside `server/` so it can be git-ignored easily.
 */
export const MEMORY_DB_PATH = path.join(SERVER_ROOT, '.mongo-data');

const isMemoryUri = (uri) => !uri || uri.startsWith('memory://');

let memoryServer = null;
let connectionPromise = null;

/**
 * Starts (or re-attaches to) a local MongoDB instance without requiring the
 * user to install MongoDB. `mongodb-memory-server` downloads a `mongod` binary
 * once and — because we pin a port and a `dbPath` with the WiredTiger storage
 * engine — the data survives process restarts, so `npm run seed` and
 * `npm run dev` share the same database.
 */
async function resolveMemoryUri() {
  const uri = `mongodb://127.0.0.1:${env.memoryDbPort}/civicfix`;

  // Another process (e.g. a previously started dev server) may already own the
  // port. In that case simply connect to it instead of spawning a second one.
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
    // eslint-disable-next-line no-console
    console.log(`[civicfix] Attached to running local MongoDB at ${uri}`);
    return null;
  } catch {
    await mongoose.disconnect().catch(() => {});
  }

  fs.mkdirSync(MEMORY_DB_PATH, { recursive: true });

  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = await import('mongodb-memory-server'));
  } catch {
    throw new Error(
      'Local MongoDB helper unavailable. Either set MONGO_URI in server/.env to a real ' +
        'MongoDB connection string, or install dependencies first (npm install).',
    );
  }

  const server = await MongoMemoryServer.create({
    instance: {
      port: env.memoryDbPort,
      dbPath: MEMORY_DB_PATH,
      storageEngine: 'wiredTiger',
    },
  });

  await mongoose.connect(server.getUri('civicfix'));
  // eslint-disable-next-line no-console
  console.log(
    `[civicfix] Started local MongoDB (data persisted in ${MEMORY_DB_PATH}).`,
  );
  return server;
}

/** Connects Mongoose using MONGO_URI, or a persisted local instance in dev. */
export async function connectDatabase() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    mongoose.set('strictQuery', true);

    if (!isMemoryUri(env.mongoUri)) {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
      // eslint-disable-next-line no-console
      console.log('[civicfix] Connected to MongoDB via MONGO_URI.');
      return mongoose.connection;
    }

    if (env.isProduction) {
      throw new Error(
        'MONGO_URI must be configured when NODE_ENV=production. Refusing to start an in-memory database in production.',
      );
    }

    memoryServer = await resolveMemoryUri();
    return mongoose.connection;
  })().catch((error) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
}

/** Closes the Mongoose connection and stops the local MongoDB if we own it. */
export async function disconnectDatabase() {
  await mongoose.disconnect().catch(() => {});
  if (memoryServer) {
    await memoryServer.stop().catch(() => {});
    memoryServer = null;
  }
  connectionPromise = null;
}
