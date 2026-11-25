import bcrypt from 'bcryptjs';
import { redisManager } from '../config/redis';
import { SafeUser, UserEntity, UserRole } from '../models/types';
import { authRepository, toSafeUser } from '../repositories/auth.repository';
import { AppError } from '../utils/appError';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

async function issueTokenPairForUser(user: UserEntity): Promise<{
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}> {
  const { token: accessToken } = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
    assignedConstituency: user.assigned_constituency,
  });

  const refresh = signRefreshToken(user.id);
  await authRepository.saveRefreshToken({
    userId: user.id,
    tokenHash: refresh.tokenHash,
    expiresAt: refresh.expiresAt,
  });

  return {
    accessToken,
    refreshToken: refresh.token,
    user: toSafeUser(user),
  };
}

export const authService = {
  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Account is disabled. Contact campaign admin.', 403, 'ACCOUNT_DISABLED');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    return issueTokenPairForUser(user);
  },

  async refresh(rawRefreshToken: string) {
    try {
      verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError('Refresh token is invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
    }

    const oldTokenHash = hashToken(rawRefreshToken);
    const provisionalNew = signRefreshToken('pending');

    const user = await authRepository.rotateRefreshToken({
      oldTokenHash,
      newTokenHash: provisionalNew.tokenHash,
      newExpiresAt: provisionalNew.expiresAt,
    });

    // Re-sign refresh token bound to verified user id and update hash if needed,
    // or simply keep refresh token bound via DB row — let's issue clean pair directly:
    const { token: accessToken } = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      assignedConstituency: user.assigned_constituency,
    });

    return {
      accessToken,
      refreshToken: provisionalNew.token,
      user: toSafeUser(user),
    };
  },

  async logout(params: { jti: string; exp: number; refreshToken?: string }): Promise<void> {
    const remainingTtl = Math.max(0, params.exp - Math.floor(Date.now() / 1000));
    await redisManager.revokeTokenJti(params.jti, remainingTtl);

    if (params.refreshToken) {
      await authRepository.revokeRefreshToken(hashToken(params.refreshToken));
    }
  },

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return toSafeUser(user);
  },

  async createWorker(params: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    assignedConstituency?: string | null;
  }): Promise<SafeUser> {
    const existing = await authRepository.findByEmail(params.email);
    if (existing) {
      throw new AppError('A user with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(params.password, 12);
    const created = await authRepository.createUser({
      fullName: params.fullName,
      email: params.email,
      passwordHash,
      role: params.role,
      assignedConstituency: params.assignedConstituency ?? null,
    });

    return toSafeUser(created);
  },
};
