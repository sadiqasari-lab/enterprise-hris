import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
import { payrollService } from '../payroll/payroll.service';

const prisma = new PrismaClient();

export class MobilePayslipService {
  private async resolveUser(userId: string): Promise<{
    userId: string;
    employeeId: string;
  }> {
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

    if (!user.employee_id) {
      throw new ApiError(404, 'Employee profile not linked to this user');
    }

    return {
      userId: user.id,
      employeeId: user.employee_id,
    };
  }

  async getPayslips(userId: string, year?: string | number): Promise<any> {
    const { employeeId } = await this.resolveUser(userId);

    const payslips = await payrollService.getEmployeePayslips(employeeId);
    const parsedYear = year ? parseInt(String(year), 10) : undefined;

    const filteredPayslips = parsedYear
      ? payslips.filter((record: any) => new Date(record.cycle.period_start).getFullYear() === parsedYear)
      : payslips;

    const summary = filteredPayslips.reduce(
      (acc: any, record: any) => {
        acc.totalGross += record.gross_salary || 0;
        acc.totalNet += record.net_salary || 0;
        acc.totalDeductions += record.total_deductions || 0;
        return acc;
      },
      { totalGross: 0, totalNet: 0, totalDeductions: 0 }
    );

    return {
      payslips: filteredPayslips,
      summary: {
        ...summary,
        count: filteredPayslips.length,
        year: parsedYear || 'all',
      },
    };
  }

  async getPayslipDetail(userId: string, cycleId: string): Promise<any> {
    if (!cycleId) {
      throw new ApiError(400, 'cycleId is required');
    }

    const { employeeId } = await this.resolveUser(userId);
    return payrollService.getPayslip(cycleId, employeeId);
  }
}

export const mobilePayslipService = new MobilePayslipService();
