import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './src/test/globalSetup.ts',
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // Integration tests share one in-memory replica set and clear
    // collections between tests rather than isolating per-file, so they
    // must not run test files concurrently against it.
    fileParallelism: false,
  },
});
