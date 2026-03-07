import { Request, Response, NextFunction } from 'express';
import { mobileAttendanceService } from './mobile-attendance.service';

export class MobileAttendanceController {
  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mobileAttendanceService.checkIn(req.userId!, req.body);
      const statusCode = result.success ? 200 : 400;

      res.status(statusCode).json({
        success: result.success,
        data: {
          record: result.record,
          validation: result.validation,
        },
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mobileAttendanceService.checkOut(req.userId!);
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await mobileAttendanceService.getStatus(req.userId!);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await mobileAttendanceService.getHistory(req.userId!, req.query as any);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mobileAttendanceController = new MobileAttendanceController();
