import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Each suite spins up its own in-memory MongoDB; running them sequentially
    // keeps resource usage predictable.
    fileParallelism: false,
    hookTimeout: 180_000,
    testTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
    },
  },
});
