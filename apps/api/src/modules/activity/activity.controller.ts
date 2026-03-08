import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

type FeedItem = {
  id: string;
  type: 'ATTENDANCE' | 'LEAVE' | 'PAYROLL';
  action: string;
  createdAt: string;
  metadata?: Record<string, any>;
};

async function resolveEmployeeIdFromUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { employee_id: true },
  });

  if (!user?.employee_id) {
    throw new ApiError(404, 'Employee record not found');
  }

  return user.employee_id;
}

export class ActivityController {
  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const employeeId = await resolveEmployeeIdFromUser(userId);
      const limit = Number(req.query.limit || 10);
      const boundedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 30) : 10;

      const [attendance, leaveRequests, payslips] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: { employee_id: employeeId },
          orderBy: { check_in_time: 'desc' },
          take: boundedLimit,
          select: {
            id: true,
            check_in_time: true,
            check_out_time: true,
            status: true,
          },
        }),
        prisma.leaveRequest.findMany({
          where: { employee_id: employeeId },
          orderBy: { created_at: 'desc' },
          take: boundedLimit,
          select: {
            id: true,
            status: true,
            start_date: true,
            end_date: true,
            created_at: true,
          },
        }),
        prisma.payrollRecord.findMany({
          where: { employee_id: employeeId },
          orderBy: {
            cycle: {
              period_end: 'desc',
            },
          },
          take: boundedLimit,
          select: {
            id: true,
            net_salary: true,
            cycle: {
              select: {
                period_start: true,
                period_end: true,
                status: true,
              },
            },
          },
        }),
      ]);

      const items: FeedItem[] = [
        ...attendance.map((record) => ({
          id: `attendance-${record.id}`,
          type: 'ATTENDANCE' as const,
          action: record.check_out_time ? 'Checked out' : 'Checked in',
          createdAt: record.check_in_time.toISOString(),
          metadata: {
            status: record.status,
            checkInTime: record.check_in_time,
            checkOutTime: record.check_out_time,
          },
        })),
        ...leaveRequests.map((request) => ({
          id: `leave-${request.id}`,
          type: 'LEAVE' as const,
          action: `Leave request ${request.status.toLowerCase()}`,
          createdAt: request.created_at.toISOString(),
          metadata: {
            status: request.status,
            startDate: request.start_date,
            endDate: request.end_date,
          },
        })),
        ...payslips.map((record) => ({
          id: `payroll-${record.id}`,
          type: 'PAYROLL' as const,
          action: 'Payslip generated',
          createdAt: record.cycle.period_end.toISOString(),
          metadata: {
            netSalary: record.net_salary,
            status: record.cycle.status,
            periodStart: record.cycle.period_start,
            periodEnd: record.cycle.period_end,
          },
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, boundedLimit);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
