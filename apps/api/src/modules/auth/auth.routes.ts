/**
 * Authentication Routes
 * Defines routes for authentication endpoints
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

/**
 * Public routes (no authentication required)
 */
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

/**
 * Protected routes (authentication required)
 */
router.post('/logout', authenticate, authController.logout.bind(authController));
router.post('/change-password', authenticate, authController.changePassword.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));

export default router;
