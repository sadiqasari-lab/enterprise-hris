/**
 * Payroll Controller
 * Handles HTTP requests for payroll endpoints
 * Enforces role-based access at controller level
 */

import { Request, Response, NextFunction } from 'express';
import { payrollService } from './payroll.service';
import { ApiError } from '../../middleware/errorHandler';

export class PayrollController {
  /**
   * POST /api/payroll/cycles
   * Create new payroll cycle (HR Officer only)
   */
  async createCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { periodStart, periodEnd, employeeIds } = req.body;
      const companyId = req.companyId!;
      const preparedBy = req.userId!;

      if (!periodStart || !periodEnd) {
        throw new ApiError(400, 'Period start and end dates are required');
      }

      const cycle = await payrollService.createPayrollCycle({
        companyId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        employeeIds: employeeIds || [],
        preparedBy,
      });

      res.status(201).json({
        success: true,
        data: { cycle },
        message: 'Payroll cycle created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/cycles/:id/records
   * Add/update payroll records (HR Officer only)
   */
  async addRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { records } = req.body;

      if (!records || !Array.isArray(records)) {
        throw new ApiError(400, 'Records array is required');
      }

      const payrollRecords = await payrollService.addPayrollRecords(id, records);

      res.status(200).json({
        success: true,
        data: { records: payrollRecords },
        message: 'Payroll records added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/cycles/:id/submit
   * Submit payroll for review (HR Officer only)
   */
  async submitForReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const submittedBy = req.userId!;

      const cycle = await payrollService.submitForReview(id, submittedBy);

      res.status(200).json({
        success: true,
        data: { cycle },
        message: 'Payroll submitted for HR Admin review',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/cycles/:id/review
   * Review payroll (HR Admin only)
   */
  async reviewPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved, rejectionReason } = req.body;
      const reviewedBy = req.userId!;

      if (typeof approved !== 'boolean') {
        throw new ApiError(400, 'Approved field (true/false) is required');
      }

      const cycle = await payrollService.reviewPayroll(
        id,
        reviewedBy,
        approved,
        rejectionReason
      );

      const message = approved
        ? 'Payroll approved and sent to GM for final approval'
        : 'Payroll rejected and sent back to HR Officer';

      res.status(200).json({
        success: true,
        data: { cycle },
        message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/cycles/:id/gm-approval
   * GM FINAL APPROVAL (GM only - CRITICAL)
   */
  async gmApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approved, rejectionReason } = req.body;
      const gmUserId = req.userId!;

      if (typeof approved !== 'boolean') {
        throw new ApiError(400, 'Approved field (true/false) is required');
      }

      const result = await payrollService.gmApproval(
        id,
        gmUserId,
        approved,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payroll/cycles/:id/execute
   * Execute payroll (HR Admin only, ONLY AFTER GM APPROVAL)
   */
  async executePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const executedBy = req.userId!;

      const cycle = await payrollService.executePayroll(id, executedBy);

      res.status(200).json({
        success: true,
        data: { cycle },
        message: 'Payroll executed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/cycles
   * Get all payroll cycles
   */
  async getCycles(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { status, year } = req.query;

      const cycles = await payrollService.getPayrollCycles(
        companyId,
        status as string | undefined,
        year ? parseInt(year as string, 10) : undefined
      );

      res.status(200).json({
        success: true,
        data: { cycles },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/cycles/:id
   * Get payroll cycle details
   */
  async getCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const cycle = await payrollService.getPayrollCycle(id);

      res.status(200).json({
        success: true,
        data: { cycle },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/reports/summary
   * Payroll summary metrics
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

      const summary = await payrollService.getPayrollSummary(companyId, year);

      res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/payroll/cycles/:id
   * Delete draft payroll cycle (HR Officer only)
   */
  async deleteCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await payrollService.deletePayrollCycle(id);

      res.status(200).json({
        success: true,
        message: 'Payroll cycle deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/payslips/:cycleId/:employeeId
   * Get specific payslip
   */
  async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const { cycleId, employeeId } = req.params;

      // Employees can only view their own payslips
      const requestingUserId = req.userId!;
      const requestingUser = await this.getUser(requestingUserId);

      if (
        requestingUser.employee_id !== employeeId &&
        !this.isHRorAbove(req.user!.roles)
      ) {
        throw new ApiError(403, 'You can only view your own payslips');
      }

      const payslip = await payrollService.getPayslip(cycleId, employeeId);

      res.status(200).json({
        success: true,
        data: { payslip },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payroll/payslips/my
   * Get my payslips (Employee self-service)
   */
  async getMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const user = await this.getUser(userId);

      if (!user.employee_id) {
        throw new ApiError(404, 'No employee record found');
      }

      const payslips = await payrollService.getEmployeePayslips(user.employee_id);

      res.status(200).json({
        success: true,
        data: { payslips },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper: Get user with employee info
   */
  private async getUser(userId: string) {
    const { PrismaClient } = await import('@hris/database');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employee_id: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  /**
   * Helper: Check if user is HR or above
   */
  private isHRorAbove(roles: string[]): boolean {
    const hrRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_OFFICER', 'GM'];
    return roles.some((role) => hrRoles.includes(role));
  }
}

export const payrollController = new PayrollController();
