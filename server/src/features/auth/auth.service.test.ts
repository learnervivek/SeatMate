import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../test/db';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { signAccessToken, verifyAccessToken } from '../../lib/jwt';
import { UserModel } from '../users/user.model';
import { loginUser, registerUser } from './auth.service';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('registerUser', () => {
  it('hashes the password rather than storing it in plain text', async () => {
    const { user } = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'correct-horse-battery',
    });

    // passwordHash is select:false, so re-fetch it explicitly.
    const fresh = await UserModel.findById(user._id).select('+passwordHash');

    expect(fresh!.passwordHash).toBeDefined();
    expect(fresh!.passwordHash).not.toBe('correct-horse-battery');
    expect(fresh!.passwordHash.startsWith('$2')).toBe(true); // bcrypt hash prefix
  });

  it('issues a signed JWT containing the new user id', async () => {
    const { user, token } = await registerUser({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
    });

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(user._id.toString());
    expect(payload.email).toBe('bob@example.com');
  });

  it('rejects a duplicate email', async () => {
    await registerUser({ name: 'Carol', email: 'carol@example.com', password: 'password123' });

    await expect(
      registerUser({ name: 'Carol Two', email: 'carol@example.com', password: 'password123' }),
    ).rejects.toThrow(ConflictError);
  });
});

describe('loginUser', () => {
  it('succeeds with correct credentials', async () => {
    await registerUser({ name: 'Dana', email: 'dana@example.com', password: 'correct-password' });

    const { user, token } = await loginUser({ email: 'dana@example.com', password: 'correct-password' });

    expect(user.email).toBe('dana@example.com');
    expect(verifyAccessToken(token).sub).toBe(user._id.toString());
  });

  it('rejects an incorrect password without revealing which part was wrong', async () => {
    await registerUser({ name: 'Eve', email: 'eve@example.com', password: 'correct-password' });

    await expect(loginUser({ email: 'eve@example.com', password: 'wrong-password' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rejects an email that was never registered, with the same generic error', async () => {
    await expect(
      loginUser({ email: 'nobody@example.com', password: 'whatever123' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe('JWT expiration', () => {
  it('accepts a token before it expires', () => {
    const token = signAccessToken({ sub: 'user-id', email: 'x@example.com' });
    expect(() => verifyAccessToken(token)).not.toThrow();
  });

  it('rejects an expired token', async () => {
    const jwt = await import('jsonwebtoken');
    const expiredToken = jwt.sign({ sub: 'user-id', email: 'x@example.com' }, process.env.JWT_SECRET!, {
      expiresIn: '1ms',
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });

  it('rejects a token signed with a different secret', async () => {
    const jwt = await import('jsonwebtoken');
    const forged = jwt.sign({ sub: 'user-id', email: 'x@example.com' }, 'a-completely-different-secret');

    expect(() => verifyAccessToken(forged)).toThrow();
  });
});
