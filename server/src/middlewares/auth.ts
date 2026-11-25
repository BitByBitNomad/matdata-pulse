import { NextFunction, Request, Response } from 'express';
import { redisManager } from '../config/redis';
import { UserRole } from '../models/types';
import { AppError } from '../utils/appError';
import { verifyAccessToken } from '../utils/jwt';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError('Authentication token is missing', 401, 'UNAUTHORIZED');
    }

    const payload = verifyAccessToken(token);

    const revoked = await redisManager.isTokenJtiRevoked(payload.jti);
    if (revoked) {
      throw new AppError('Token has been revoked. Please sign in again.', 401, 'TOKEN_REVOKED');
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
      assignedConstituency: payload.assignedConstituency,
      jti: payload.jti,
      exp: payload.exp,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'FORBIDDEN'
        )
      );
      return;
    }

    next();
  };
}
