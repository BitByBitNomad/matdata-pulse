import { query, withTransaction } from '../config/database';
import { SafeUser, UserEntity, UserRole } from '../models/types';
import { AppError } from '../utils/appError';

export function toSafeUser(user: UserEntity): SafeUser {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    assignedConstituency: user.assigned_constituency,
    isActive: user.is_active,
    createdAt: user.created_at.toISOString(),
  };
}

export const authRepository = {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const res = await query<UserEntity>(
      `SELECT id, full_name, email, password_hash, role, assigned_constituency, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );
    return res.rows[0] ?? null;
  },

  async findById(id: string): Promise<UserEntity | null> {
    const res = await query<UserEntity>(
      `SELECT id, full_name, email, password_hash, role, assigned_constituency, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  },

  async createUser(params: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    assignedConstituency: string | null;
  }): Promise<UserEntity> {
    const res = await query<UserEntity>(
      `INSERT INTO users (full_name, email, password_hash, role, assigned_constituency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, password_hash, role, assigned_constituency, is_active, created_at, updated_at`,
      [
        params.fullName,
        params.email.toLowerCase(),
        params.passwordHash,
        params.role,
        params.assignedConstituency,
      ]
    );
    return res.rows[0];
  },

  async saveRefreshToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [params.userId, params.tokenHash, params.expiresAt]
    );
  },

  /**
   * Row-level locked (`FOR UPDATE`) refresh token rotation prevents replay races.
   */
  async rotateRefreshToken(params: {
    oldTokenHash: string;
    newTokenHash: string;
    newExpiresAt: Date;
  }): Promise<UserEntity> {
    return withTransaction(async (client) => {
      const tokenRes = await client.query<{
        id: string;
        user_id: string;
        expires_at: Date;
        revoked_at: Date | null;
      }>(
        `SELECT id, user_id, expires_at, revoked_at
         FROM refresh_tokens
         WHERE token_hash = $1
         FOR UPDATE`,
        [params.oldTokenHash]
      );

      const existing = tokenRes.rows[0];
      if (!existing || existing.revoked_at !== null || existing.expires_at <= new Date()) {
        throw new AppError('Refresh token is invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
      }

      await client.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
        [existing.id]
      );

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [existing.user_id, params.newTokenHash, params.newExpiresAt]
      );

      const userRes = await client.query<UserEntity>(
        `SELECT id, full_name, email, password_hash, role, assigned_constituency, is_active, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [existing.user_id]
      );

      const user = userRes.rows[0];
      if (!user || !user.is_active) {
        throw new AppError('User account is inactive or missing', 401, 'ACCOUNT_INACTIVE');
      }

      return user;
    });
  },

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );
  },
};
