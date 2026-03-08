import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { activityController } from './activity.controller';

const router = Router();

router.get('/feed', authenticate, activityController.getFeed.bind(activityController));

export default router;
