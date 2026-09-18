import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * Runs once for the whole test run (Vitest `globalSetup`), before any test
 * file is imported. A replica set — not a plain standalone server — because
 * the swap-accept flow uses a real MongoDB transaction, and we want tests to
 * exercise that for real rather than mocking it away.
 */
export default async function setup() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

  process.env.MONGODB_URI = replSet.getUri('seatmate-test');
  process.env.JWT_SECRET = 'vitest-only-test-secret-do-not-use-in-real-life';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.COOKIE_NAME = 'seatmate_token';
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_ORIGIN = 'http://localhost:5174';

  return async () => {
    await replSet.stop();
  };
}
