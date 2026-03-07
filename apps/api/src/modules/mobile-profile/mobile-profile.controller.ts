import { Request, Response, NextFunction } from 'express';
import { mobileProfileService } from './mobile-profile.service';

export class MobileProfileController {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await mobileProfileService.getProfile(req.userId!);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await mobileProfileService.updateProfile(req.userId!, req.body);
      res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mobileProfileController = new MobileProfileController();
