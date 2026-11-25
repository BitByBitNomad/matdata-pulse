import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Valid refresh token is required'),
});

export const createWorkerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  role: z.enum(['field_worker', 'admin']).default('field_worker'),
  assignedConstituency: z.string().trim().max(120).nullable().optional(),
});
