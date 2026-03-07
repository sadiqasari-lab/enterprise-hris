import { Request, Response, NextFunction } from 'express';
import { mobileLeaveService } from './mobile-leave.service';

export class MobileLeaveController {
  async getTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mobileLeaveService.getLeaveTypes(req.userId!);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mobileLeaveService.getBalances(req.userId!, req.query.year as string | undefined);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mobileLeaveService.getMyRequests(req.userId!, req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequest = await mobileLeaveService.createRequest(req.userId!, req.body);
      res.status(201).json({
        success: true,
        data: { leaveRequest },
        message: 'Leave request submitted',
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequest = await mobileLeaveService.cancelRequest(req.userId!, req.params.id);
      res.status(200).json({
        success: true,
        data: { leaveRequest },
        message: 'Leave request cancelled',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mobileLeaveController = new MobileLeaveController();
