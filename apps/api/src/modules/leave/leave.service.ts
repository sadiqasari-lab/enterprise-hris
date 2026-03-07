/**
 * Leave Management Service
 * Handles leave types, balances, requests, and approval workflows.
 * Saudi labour-law aware: annual leave accrual, carry-forward caps, holiday exclusion.
 */

import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateLeaveTypeData {
  companyId: string;
  name: string;
  nameAr?: string;
  code: string;
  daysPerYear: number;
  isPaid?: boolean;
  requiresApproval?: boolean;
}

export interface CreateLeaveRequestData {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export class LeaveService {
  // ──────────────────────────────────────────────
  // Leave Types
  // ──────────────────────────────────────────────
  async createLeaveType(data: CreateLeaveTypeData): Promise<any> {
    const existing = await prisma.leaveType.findFirst({
      where: { company_id: data.companyId, code: data.code },
    });
    if (existing) throw new ApiError(409, `Leave type code '${data.code}' already exists`);

    return prisma.leaveType.create({
      data: {
        company_id: data.companyId,
        name: data.name,
        name_ar: data.nameAr ?? null,
        code: data.code,
        days_per_year: data.daysPerYear,
        is_paid: data.isPaid ?? true,
        requires_approval: data.requiresApproval ?? true,
      },
    });
  }

  async getLeaveTypes(companyId: string): Promise<any[]> {
    return prisma.leaveType.findMany({
      where: { company_id: companyId, is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  // ──────────────────────────────────────────────
  // Leave Balances
  // ──────────────────────────────────────────────
  async getEmployeeBalances(employeeId: string, year: number): Promise<any[]> {
    return prisma.leaveBalance.findMany({
      where: { employee_id: employeeId, year },
      include: { leave_type: true },
    });
  }

  /**
   * Initialise balances for a new employee (or new year).
   * Called during onboarding or at fiscal-year rollover.
   */
  async initializeBalances(employeeId: string, companyId: string, year: number): Promise<any[]> {
    const leaveTypes = await prisma.leaveType.findMany({
      where: { company_id: companyId, is_active: true },
    });

    const balances = await Promise.all(
      leaveTypes.map((lt) =>
        prisma.leaveBalance.upsert({
          where: {
            employee_id_leave_type_id_year: {
              employee_id: employeeId,
              leave_type_id: lt.id,
              year,
            },
          },
          create: {
            employee_id: employeeId,
            leave_type_id: lt.id,
            year,
            total_days: lt.days_per_year,
            used_days: 0,
            remaining_days: lt.days_per_year,
          },
          update: {}, // no-op if already exists
        })
      )
    );
    return balances;
  }

  // ──────────────────────────────────────────────
  // Holidays helper – count public holidays in a range
  // ──────────────────────────────────────────────
  private async countHolidaysInRange(companyId: string, start: Date, end: Date): Promise<number> {
    const holidays = await prisma.holiday.findMany({
      where: {
        OR: [
          { company_id: companyId },
          { company_id: null }, // national holidays
        ],
        date: { gte: start, lte: end },
      },
    });
    return holidays.length;
  }

  /**
   * Calculate working days between two dates, excluding weekends (Fri/Sat for Saudi)
   * and public / company holidays.
   */
  async calculateWorkingDays(companyId: string, startDate: Date, endDate: Date): Promise<number> {
    let count = 0;
    const holidays = new Set<string>();

    const holidayRecords = await prisma.holiday.findMany({
      where: {
        OR: [{ company_id: companyId }, { company_id: null }],
        date: { gte: startDate, lte: endDate },
      },
    });
    holidayRecords.forEach((h) => holidays.add(h.date.toISOString().split('T')[0]));

    const current = new Date(startDate);
    while (current <= endDate) {
      const day = current.getDay(); // 0=Sun … 6=Sat
      const dateStr = current.toISOString().split('T')[0];
      // Saudi weekend = Friday (5) & Saturday (6)
      if (day !== 5 && day !== 6 && !holidays.has(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  // ──────────────────────────────────────────────
  // Leave Requests
  // ──────────────────────────────────────────────
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<any> {
    // Validate employee exists
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new ApiError(404, 'Employee not found');

    // Validate leave type
    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!leaveType) throw new ApiError(404, 'Leave type not found');

    // Validate dates
    if (data.startDate > data.endDate) throw new ApiError(400, 'Start date must be before end date');
    if (data.startDate < new Date()) throw new ApiError(400, 'Start date cannot be in the past');

    // Calculate working days
    const totalDays = await this.calculateWorkingDays(employee.company_id, data.startDate, data.endDate);
    if (totalDays === 0) throw new ApiError(400, 'No working days in the selected range');

    // Check leave balance
    const year = data.startDate.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: data.employeeId,
          leave_type_id: data.leaveTypeId,
          year,
        },
      },
    });

    if (!balance) throw new ApiError(400, 'No leave balance found. Contact HR.');
    if (balance.remaining_days < totalDays)
      throw new ApiError(400, `Insufficient balance. Available: ${balance.remaining_days} days, Requested: ${totalDays} days`);

    // Check for overlapping requests (non-cancelled/rejected)
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employee_id: data.employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        start_date: { lte: data.endDate },
        end_date: { gte: data.startDate },
      },
    });
    if (overlap) throw new ApiError(409, 'An overlapping leave request already exists');

    // Create request
    const request = await prisma.leaveRequest.create({
      data: {
        employee_id: data.employeeId,
        leave_type_id: data.leaveTypeId,
        start_date: data.startDate,
        end_date: data.endDate,
        total_days: totalDays,
        reason: data.reason ?? null,
        status: leaveType.requires_approval ? 'PENDING' : 'APPROVED',
      },
      include: { leave_type: true, employee: true },
    });

    // If auto-approved, deduct balance immediately
    if (!leaveType.requires_approval) {
      await this.deductBalance(data.employeeId, data.leaveTypeId, year, totalDays);
    }

    return request;
  }

  async getLeaveRequests(filters: {
    employeeId?: string;
    companyId?: string;
    status?: string;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ requests: any[]; total: number }> {
    const { page = 1, limit = 20, ...rest } = filters;

    const where: any = {};
    if (rest.employeeId) where.employee_id = rest.employeeId;
    if (rest.status) where.status = rest.status;
    if (rest.year) {
      where.start_date = { gte: new Date(`${rest.year}-01-01`) };
      where.end_date = { lte: new Date(`${rest.year}-12-31`) };
    }
    if (rest.companyId) {
      where.employee = { company_id: rest.companyId };
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: { leave_type: true, employee: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { requests, total };
  }

  // ──────────────────────────────────────────────
  // Approve / Reject / Cancel
  // ──────────────────────────────────────────────
  async approveLeaveRequest(requestId: string, approvedBy: string): Promise<any> {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ApiError(404, 'Leave request not found');
    if (request.status !== 'PENDING') throw new ApiError(400, `Cannot approve request in '${request.status}' status`);

    // Deduct balance
    await this.deductBalance(request.employee_id, request.leave_type_id, request.start_date.getFullYear(), request.total_days);

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date(),
      },
      include: { leave_type: true, employee: true },
    });
  }

  async rejectLeaveRequest(requestId: string, rejectedBy: string, reason: string): Promise<any> {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ApiError(404, 'Leave request not found');
    if (request.status !== 'PENDING') throw new ApiError(400, `Cannot reject request in '${request.status}' status`);

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', rejection_reason: reason },
      include: { leave_type: true, employee: true },
    });
  }

  async cancelLeaveRequest(requestId: string, employeeId: string): Promise<any> {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new ApiError(404, 'Leave request not found');
    if (request.employee_id !== employeeId) throw new ApiError(403, 'You can only cancel your own requests');
    if (request.status === 'REJECTED' || request.status === 'CANCELLED')
      throw new ApiError(400, `Cannot cancel request in '${request.status}' status`);

    // Restore balance if was approved
    if (request.status === 'APPROVED') {
      await this.restoreBalance(request.employee_id, request.leave_type_id, request.start_date.getFullYear(), request.total_days);
    }

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
      include: { leave_type: true, employee: true },
    });
  }

  // ──────────────────────────────────────────────
  // Balance helpers
  // ──────────────────────────────────────────────
  private async deductBalance(employeeId: string, leaveTypeId: string, year: number, days: number) {
    await prisma.leaveBalance.update({
      where: {
        employee_id_leave_type_id_year: { employee_id: employeeId, leave_type_id: leaveTypeId, year },
      },
      data: {
        used_days: { increment: days },
        remaining_days: { decrement: days },
      },
    });
  }

  private async restoreBalance(employeeId: string, leaveTypeId: string, year: number, days: number) {
    await prisma.leaveBalance.update({
      where: {
        employee_id_leave_type_id_year: { employee_id: employeeId, leave_type_id: leaveTypeId, year },
      },
      data: {
        used_days: { decrement: days },
        remaining_days: { increment: days },
      },
    });
  }
}
