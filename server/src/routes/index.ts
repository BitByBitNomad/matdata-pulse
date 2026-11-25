import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { authRoutes } from './auth.routes';
import { surveyRoutes } from './survey.routes';

const router = Router();

router.get('/health', healthController);
router.use('/api/auth', authRoutes);
router.use('/api/surveys', surveyRoutes);

export const apiRouter = router;
