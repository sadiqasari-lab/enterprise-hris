import { NextFunction, Request, Response } from 'express';
import { mobilePayslipService } from './mobile-payslip.service';

export class MobilePayslipController {
  async getPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mobilePayslipService.getPayslips(req.userId!, req.query.year as string | undefined);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayslipDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const payslip = await mobilePayslipService.getPayslipDetail(req.userId!, req.params.cycleId);
      res.status(200).json({
        success: true,
        data: { payslip },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mobilePayslipController = new MobilePayslipController();
