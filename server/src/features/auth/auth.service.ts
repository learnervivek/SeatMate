import bcrypt from 'bcryptjs';
import { UserModel, type UserDocument } from '../users/user.model';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { signAccessToken } from '../../lib/jwt';
import type { LoginInput, RegisterInput } from './auth.validators';

const SALT_ROUNDS = 12;

export async function registerUser(
  input: RegisterInput,
): Promise<{ user: UserDocument; token: string }> {
  const existing = await UserModel.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  return { user, token };
}

export async function loginUser(
  input: LoginInput,
): Promise<{ user: UserDocument; token: string }> {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });
  return { user, token };
}

export async function getUserById(userId: string): Promise<UserDocument | null> {
  return UserModel.findById(userId);
}
