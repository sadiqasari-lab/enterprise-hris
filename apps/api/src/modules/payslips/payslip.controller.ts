import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class PayslipController {
  async getMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: { employee_id: true },
      });

      if (!user?.employee_id) {
        throw new ApiError(404, 'Employee record not found');
      }

      const records = await prisma.payrollRecord.findMany({
        where: { employee_id: user.employee_id },
        include: {
          cycle: {
            select: {
              period_start: true,
              period_end: true,
              status: true,
            },
          },
        },
        orderBy: {
          cycle: {
            period_end: 'desc',
          },
        },
      });

      const payslips = records.map((record) => ({
        id: record.id,
        period: record.cycle.period_start.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        amount: record.net_salary,
        status: record.cycle.status,
        paidDate: record.cycle.period_end,
      }));

      res.status(200).json({
        success: true,
        data: payslips,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const payslipController = new PayslipController();
