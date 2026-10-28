import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

/** Boots an ephemeral MongoDB for the current test file. */
export async function startTestDb() {
  memoryServer = await MongoMemoryServer.create({
    // Spawning a fresh mongod per suite can occasionally take longer than the
    // 10s default on cold starts, so allow a generous window.
    instance: { launchTimeout: 120_000 },
  });
  await mongoose.connect(memoryServer.getUri('civicfix_test'));
}

/** Tears the ephemeral database down again. */
export async function stopTestDb() {
  await mongoose.disconnect().catch(() => {});
  await memoryServer?.stop().catch(() => {});
  memoryServer = null;
}

/** Empties every collection between tests. */
export async function clearDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

export default { startTestDb, stopTestDb, clearDatabase };
