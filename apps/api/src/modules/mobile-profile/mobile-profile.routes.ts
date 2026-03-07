import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { mobileProfileController } from './mobile-profile.controller';

const router = Router();

router.get('/me', authenticate, mobileProfileController.getMyProfile.bind(mobileProfileController));
router.put('/me', authenticate, mobileProfileController.updateMyProfile.bind(mobileProfileController));

export default router;
