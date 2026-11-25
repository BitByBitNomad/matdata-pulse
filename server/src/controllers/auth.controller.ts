import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const data = await authService.login(email, password);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const data = await authService.refresh(refreshToken);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined;
      await authService.logout({
        jti: req.user!.jti,
        exp: req.user!.exp,
        refreshToken,
      });
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  async createWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.createWorker(req.body);
      res.status(201).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },
};
