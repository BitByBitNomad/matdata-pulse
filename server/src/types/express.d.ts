import { UserRole } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      validatedQuery?: unknown;
      user?: {
        id: string;
        email: string;
        role: UserRole;
        fullName: string;
        assignedConstituency: string | null;
        jti: string;
        exp: number;
      };
    }
  }
}

export {};
