import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../middleware/errorHandler';
import { authService } from '../auth/auth.service';

export class MobileAuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, deviceInfo } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: {
          ...result,
          session: {
            platform: 'mobile',
            issuedAt: new Date().toISOString(),
            deviceInfo: deviceInfo || null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

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

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout();
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mobileAuthController = new MobileAuthController();
