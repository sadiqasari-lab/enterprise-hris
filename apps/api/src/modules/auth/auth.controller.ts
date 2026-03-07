/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiError } from '../../middleware/errorHandler';

export class AuthController {
  /**
   * POST /api/auth/login
   * User login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      const tokens = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * User logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.logout();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId!;

      if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current and new passwords are required');
      }

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(400, 'Email is required');
      }

      const result = await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new ApiError(400, 'Token and new password are required');
      }

      const result = await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   * Get user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const profile = await authService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: { user: profile },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
