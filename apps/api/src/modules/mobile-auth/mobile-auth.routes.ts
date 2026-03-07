import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { mobileAuthController } from './mobile-auth.controller';

const router = Router();

router.post('/login', mobileAuthController.login.bind(mobileAuthController));
router.post('/refresh', mobileAuthController.refreshToken.bind(mobileAuthController));
router.post('/logout', authenticate, mobileAuthController.logout.bind(mobileAuthController));

export default router;
