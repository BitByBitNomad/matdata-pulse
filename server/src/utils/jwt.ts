import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AccessTokenPayload, UserRole } from '../models/types';

export interface SignedTokenPair {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshExpiresAt: Date;
}

export function signAccessToken(params: {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  assignedConstituency: string | null;
}): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: params.userId,
    email: params.email,
    role: params.role,
    fullName: params.fullName,
    assignedConstituency: params.assignedConstituency,
    jti,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'matdata-pulse-api',
    audience: 'matdata-pulse-clients',
  };

  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'matdata-pulse-api',
    audience: 'matdata-pulse-clients',
  }) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const jti = crypto.randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: 'matdata-pulse-api',
    audience: 'matdata-pulse-refresh',
  };
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, options);
  const tokenHash = hashToken(token);
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { token, tokenHash, expiresAt };
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'matdata-pulse-api',
    audience: 'matdata-pulse-refresh',
  }) as { sub: string; jti: string };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
