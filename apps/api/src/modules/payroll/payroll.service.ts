/**
 * Payroll Service
 * Handles payroll processing with STRICT GM approval workflow
 * 
 * CRITICAL WORKFLOW (NON-BYPASSABLE):
 * Step 1: HR Officer prepares payroll (status: DRAFT)
 * Step 2: HR Officer submits for review (status: PENDING_REVIEW)
 * Step 3: HR Admin reviews and approves (status: PENDING_GM_APPROVAL)
 * Step 4: GM gives FINAL APPROVAL (status: APPROVED) - LOCKS PAYROLL
 * Step 5: Execute payroll (status: EXECUTED)
 * 
 * GM approval is MANDATORY - no bypass allowed
 */

import { PrismaClient } from '@hris/database';
import { ApiError, forbidden, unauthorized } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreatePayrollData {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  employeeIds: string[];
  preparedBy: string;
}

export interface PayrollRecordData {
  employeeId: string;
  basicSalary: number;
  allowances: {
    housing?: number;
    transport?: number;
    [key: string]: number | undefined;
  };
  deductions: {
    insurance?: number;
    tax?: number;
    [key: string]: number | undefined;
  };
  overtimeAmount?: number;
  bonuses?: number;
}

export class PayrollService {
  /**
   * Step 1: HR Officer creates payroll cycle (DRAFT)
   */
  async createPayrollCycle(data: CreatePayrollData): Promise<any> {
    // Validate period
    if (data.periodStart >= data.periodEnd) {
      throw new ApiError(400, 'Period start must be before period end');
    }

    // Check for overlapping payroll cycles
    const existingCycle = await prisma.payrollCycle.findFirst({
      where: {
        company_id: data.companyId,
        OR: [
          {
            period_start: {
              lte: data.periodEnd,
            },
            period_end: {
              gte: data.periodStart,
            },
          },
        ],
        status: {
          in: ['DRAFT', 'PENDING_REVIEW', 'PENDING_GM_APPROVAL', 'APPROVED'],
        },
      },
    });

    if (existingCycle) {
      throw new ApiError(409, 'An active payroll cycle already exists for this period');
    }

    // Create payroll cycle in DRAFT status
    const cycle = await prisma.payrollCycle.create({
      data: {
        company_id: data.companyId,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        status: 'DRAFT',
        prepared_by: data.preparedBy,
        prepared_at: new Date(),
        is_locked: false,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    return cycle;
  }

  /**
   * Add/Update employee payroll records
   */
  async addPayrollRecords(
    cycleId: string,
    records: PayrollRecordData[]
  ): Promise<any> {
    // Verify cycle is in DRAFT status
    const cycle = await this.validateCycleStatus(cycleId, ['DRAFT']);

    // Process each employee record
    const payrollRecords = [];

    for (const record of records) {
      // Get employee's salary structure
      const salaryStructure = await prisma.salaryStructure.findFirst({
        where: {
          employee_id: record.employeeId,
          effective_from: {
            lte: cycle.period_end,
          },
          OR: [
            { effective_to: null },
            { effective_to: { gte: cycle.period_start } },
          ],
        },
        orderBy: {
          effective_from: 'desc',
        },
      });

      if (!salaryStructure) {
        throw new ApiError(404, `No salary structure found for employee ${record.employeeId}`);
      }

      // Calculate totals
      const allowancesTotal = Object.values(record.allowances || {}).reduce(
        (sum, val) => sum + (val || 0),
        0
      );

      const deductionsTotal = Object.values(record.deductions || {}).reduce(
        (sum, val) => sum + (val || 0),
        0
      );

      const grossSalary =
        record.basicSalary +
        allowancesTotal +
        (record.overtimeAmount || 0) +
        (record.bonuses || 0);

      const netSalary = grossSalary - deductionsTotal;

      // Create or update payroll record
      const payrollRecord = await prisma.payrollRecord.upsert({
        where: {
          cycle_id_employee_id: {
            cycle_id: cycleId,
            employee_id: record.employeeId,
          },
        },
        create: {
          cycle_id: cycleId,
          employee_id: record.employeeId,
          basic_salary: record.basicSalary,
          allowances: record.allowances,
          overtime_amount: record.overtimeAmount || 0,
          bonuses: record.bonuses || 0,
          gross_salary: grossSalary,
          deductions: record.deductions,
          total_deductions: deductionsTotal,
          net_salary: netSalary,
        },
        update: {
          basic_salary: record.basicSalary,
          allowances: record.allowances,
          overtime_amount: record.overtimeAmount || 0,
          bonuses: record.bonuses || 0,
          gross_salary: grossSalary,
          deductions: record.deductions,
          total_deductions: deductionsTotal,
          net_salary: netSalary,
        },
        include: {
          employee: {
            select: {
              first_name: true,
              last_name: true,
              employee_number: true,
            },
          },
        },
      });

      payrollRecords.push(payrollRecord);
    }

    return payrollRecords;
  }

  /**
   * Step 2: HR Officer submits payroll for review
   */
  async submitForReview(cycleId: string, submittedBy: string): Promise<any> {
    // Verify cycle is in DRAFT status
    const cycle = await this.validateCycleStatus(cycleId, ['DRAFT']);

    // Check that cycle has payroll records
    const recordCount = await prisma.payrollRecord.count({
      where: { cycle_id: cycleId },
    });

    if (recordCount === 0) {
      throw new ApiError(400, 'Cannot submit empty payroll cycle');
    }

    // Update status to PENDING_REVIEW
    const updatedCycle = await prisma.payrollCycle.update({
      where: { id: cycleId },
      data: {
        status: 'PENDING_REVIEW',
        updated_at: new Date(),
      },
      include: {
        records: {
          include: {
            employee: {
              select: {
                first_name: true,
                last_name: true,
                employee_number: true,
              },
            },
          },
        },
      },
    });

    // TODO: Send notification to HR Admin

    return updatedCycle;
  }

  /**
   * Step 3: HR Admin reviews and approves payroll
   * This sends it to GM for FINAL approval
   */
  async reviewPayroll(
    cycleId: string,
    reviewedBy: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    // Verify cycle is in PENDING_REVIEW status
    const cycle = await this.validateCycleStatus(cycleId, ['PENDING_REVIEW']);

    if (approved) {
      // HR Admin approves - send to GM
      const updatedCycle = await prisma.payrollCycle.update({
        where: { id: cycleId },
        data: {
          status: 'PENDING_GM_APPROVAL',
          reviewed_by: reviewedBy,
          reviewed_at: new Date(),
        },
        include: {
          records: true,
        },
      });

      // TODO: Send notification to GM

      return updatedCycle;
    } else {
      // HR Admin rejects - send back to DRAFT
      if (!rejectionReason) {
        throw new ApiError(400, 'Rejection reason is required');
      }

      const updatedCycle = await prisma.payrollCycle.update({
        where: { id: cycleId },
        data: {
          status: 'DRAFT',
          reviewed_by: reviewedBy,
          reviewed_at: new Date(),
          // Store rejection in metadata or separate table
        },
      });

      // TODO: Send notification to HR Officer

      return updatedCycle;
    }
  }

  /**
   * Step 4: GM FINAL APPROVAL (CRITICAL - NON-BYPASSABLE)
   * This is the ONLY way to approve payroll for execution
   * After GM approval, payroll is LOCKED and cannot be modified
   */
  async gmApproval(
    cycleId: string,
    gmUserId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    // CRITICAL: Verify cycle is in PENDING_GM_APPROVAL status
    const cycle = await this.validateCycleStatus(cycleId, ['PENDING_GM_APPROVAL']);

    // CRITICAL: Verify user is GM
    // This check happens in middleware, but double-check here
    const user = await prisma.user.findUnique({
      where: { id: gmUserId },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isGM = user?.user_roles.some((ur) => ur.role.name === 'GM');
    if (!isGM) {
      throw forbidden('Only GM can give final payroll approval');
    }

    if (approved) {
      // GM APPROVES - LOCK THE PAYROLL
      const updatedCycle = await prisma.payrollCycle.update({
        where: { id: cycleId },
        data: {
          status: 'APPROVED',
          approved_by_gm: gmUserId,
          approved_at_gm: new Date(),
          is_locked: true, // PAYROLL IS NOW LOCKED
        },
        include: {
          records: {
            include: {
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  employee_number: true,
                },
              },
            },
          },
        },
      });

      // TODO: Send notification to HR that payroll is ready for execution

      return {
        ...updatedCycle,
        message: 'Payroll approved by GM and locked. Ready for execution.',
      };
    } else {
      // GM REJECTS - send back to HR Admin for corrections
      if (!rejectionReason) {
        throw new ApiError(400, 'Rejection reason is required');
      }

      const updatedCycle = await prisma.payrollCycle.update({
        where: { id: cycleId },
        data: {
          status: 'PENDING_REVIEW',
          approved_by_gm: gmUserId,
          approved_at_gm: new Date(),
          // Store rejection reason
        },
      });

      // TODO: Send notification to HR Admin

      return {
        ...updatedCycle,
        message: 'Payroll rejected by GM. Sent back for corrections.',
      };
    }
  }

  /**
   * Step 5: Execute payroll (ONLY AFTER GM APPROVAL)
   */
  async executePayroll(cycleId: string, executedBy: string): Promise<any> {
    const cycle = await prisma.payrollCycle.findUnique({
      where: { id: cycleId },
      include: {
        records: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!cycle) {
      throw new ApiError(404, 'Payroll cycle not found');
    }

    if (cycle.status === 'EXECUTED') {
      throw new ApiError(400, 'Payroll has already been executed');
    }

    // CRITICAL VALIDATION: Must be approved by GM
    if (cycle.status !== 'APPROVED') {
      throw forbidden('Payroll must be approved by GM before execution');
    }

    if (!cycle.approved_by_gm) {
      throw forbidden('GM approval not found - cannot execute payroll');
    }

    if (!cycle.is_locked) {
      throw forbidden('Payroll must be locked before execution');
    }

    // Execute payroll (in transaction)
    const updatedCycle = await prisma.$transaction(async (tx) => {
      // Generate payslips
      // Process payments
      // Update employee records
      // etc.

      // Update cycle status
      const executed = await tx.payrollCycle.update({
        where: { id: cycleId },
        data: {
          status: 'EXECUTED',
          executed_by: executedBy,
          executed_at: new Date(),
        },
        include: {
          records: {
            include: {
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  employee_number: true,
                },
              },
            },
          },
        },
      });

      return executed;
    });

    // TODO: Send payslips to employees

    return updatedCycle;
  }

  /**
   * Get payroll cycle by ID
   */
  async getPayrollCycle(cycleId: string): Promise<any> {
    const cycle = await prisma.payrollCycle.findUnique({
      where: { id: cycleId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        records: {
          include: {
            employee: {
              select: {
                first_name: true,
                last_name: true,
                employee_number: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new ApiError(404, 'Payroll cycle not found');
    }

    // Calculate summary
    const summary = {
      totalEmployees: cycle.records.length,
      totalGrossSalary: cycle.records.reduce((sum, r) => sum + r.gross_salary, 0),
      totalDeductions: cycle.records.reduce((sum, r) => sum + r.total_deductions, 0),
      totalNetSalary: cycle.records.reduce((sum, r) => sum + r.net_salary, 0),
    };

    return {
      ...cycle,
      summary,
    };
  }

  /**
   * Get all payroll cycles for a company
   */
  async getPayrollCycles(
    companyId: string,
    status?: string,
    year?: number
  ): Promise<any> {
    const where: any = {
      company_id: companyId,
    };

    if (status) {
      where.status = status;
    }

    if (year) {
      where.period_start = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    const cycles = await prisma.payrollCycle.findMany({
      where,
      include: {
        records: {
          select: {
            gross_salary: true,
            net_salary: true,
          },
        },
      },
      orderBy: {
        period_start: 'desc',
      },
    });

    return cycles.map((cycle) => ({
      ...cycle,
      summary: {
        totalEmployees: cycle.records.length,
        totalGrossSalary: cycle.records.reduce((sum, r) => sum + r.gross_salary, 0),
        totalNetSalary: cycle.records.reduce((sum, r) => sum + r.net_salary, 0),
      },
    }));
  }

  /**
   * Get payroll summary metrics for reporting dashboard
   */
  async getPayrollSummary(companyId: string, year?: number): Promise<any> {
    const where: any = { company_id: companyId };
    if (year) {
      where.period_start = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    const cycles = await prisma.payrollCycle.findMany({
      where,
      include: {
        records: {
          select: {
            gross_salary: true,
            total_deductions: true,
            net_salary: true,
          },
        },
      },
      orderBy: {
        period_start: 'asc',
      },
    });

    const byStatus: Record<string, number> = {};
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalRecords = 0;
    const monthlyMap = new Map<string, { gross: number; net: number; cycles: number }>();

    for (const cycle of cycles) {
      byStatus[cycle.status] = (byStatus[cycle.status] || 0) + 1;

      for (const record of cycle.records) {
        totalGross += record.gross_salary;
        totalDeductions += record.total_deductions;
        totalNet += record.net_salary;
        totalRecords += 1;
      }

      const monthKey = cycle.period_start.toISOString().slice(0, 7);
      const current = monthlyMap.get(monthKey) || { gross: 0, net: 0, cycles: 0 };
      current.gross += cycle.records.reduce((sum, r) => sum + r.gross_salary, 0);
      current.net += cycle.records.reduce((sum, r) => sum + r.net_salary, 0);
      current.cycles += 1;
      monthlyMap.set(monthKey, current);
    }

    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, ...value }));

    return {
      period: year || 'all-time',
      totalCycles: cycles.length,
      totalPayrollRecords: totalRecords,
      totalGrossSalary: totalGross,
      totalDeductions,
      totalNetSalary: totalNet,
      averageNetPerRecord: totalRecords > 0 ? totalNet / totalRecords : 0,
      pendingApprovals: (byStatus.PENDING_REVIEW || 0) + (byStatus.PENDING_GM_APPROVAL || 0),
      byStatus,
      monthlyTrend,
    };
  }

  /**
   * Get payslip for employee
   */
  async getPayslip(cycleId: string, employeeId: string): Promise<any> {
    const record = await prisma.payrollRecord.findUnique({
      where: {
        cycle_id_employee_id: {
          cycle_id: cycleId,
          employee_id: employeeId,
        },
      },
      include: {
        cycle: {
          select: {
            period_start: true,
            period_end: true,
            status: true,
          },
        },
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new ApiError(404, 'Payslip not found');
    }

    return record;
  }

  /**
   * Get employee's payslip history
   */
  async getEmployeePayslips(employeeId: string): Promise<any> {
    const records = await prisma.payrollRecord.findMany({
      where: {
        employee_id: employeeId,
      },
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
          period_start: 'desc',
        },
      },
    });

    return records;
  }

  /**
   * Delete draft payroll cycle
   */
  async deletePayrollCycle(cycleId: string): Promise<void> {
    // Can only delete DRAFT cycles
    const cycle = await this.validateCycleStatus(cycleId, ['DRAFT']);

    await prisma.payrollCycle.delete({
      where: { id: cycleId },
    });
  }

  /**
   * Helper: Validate cycle status
   */
  private async validateCycleStatus(
    cycleId: string,
    allowedStatuses: string[]
  ): Promise<any> {
    const cycle = await prisma.payrollCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new ApiError(404, 'Payroll cycle not found');
    }

    if (!allowedStatuses.includes(cycle.status)) {
      throw new ApiError(
        400,
        `Invalid payroll status. Current: ${cycle.status}, Required: ${allowedStatuses.join(' or ')}`
      );
    }

    return cycle;
  }
}

export const payrollService = new PayrollService();
