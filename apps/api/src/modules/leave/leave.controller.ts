/**
 * Leave Controller
 * Mirrors the PayrollController / AttendanceController patterns exactly.
 */

import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service';
import { ApiError } from '../../middleware/errorHandler';

const leaveService = new LeaveService();

export class LeaveController {
  // ── Leave Types ──────────────────────────────────────
  async createLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, nameAr, code, daysPerYear, isPaid, requiresApproval } = req.body;
      if (!name || !code || daysPerYear === undefined)
        throw new ApiError(400, 'name, code, and daysPerYear are required');

      const leaveType = await leaveService.createLeaveType({
        companyId: req.companyId!,
        name, nameAr, code, daysPerYear, isPaid, requiresApproval,
      });

      res.status(201).json({ success: true, data: { leaveType }, message: 'Leave type created' });
    } catch (e) { next(e); }
  }

  async getLeaveTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await leaveService.getLeaveTypes(req.companyId!);
      res.json({ success: true, data: { leaveTypes: types } });
    } catch (e) { next(e); }
  }

  // ── Balances ─────────────────────────────────────────
  async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getEmployeeBalances(employeeId, year);
      res.json({ success: true, data: { balances } });
    } catch (e) { next(e); }
  }

  async getMyBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const { PrismaClient } = await import('@hris/database');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { employee_id: true } });
      if (!user?.employee_id) throw new ApiError(404, 'Employee record not found');

      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getEmployeeBalances(user.employee_id, year);
      res.json({ success: true, data: { balances } });
    } catch (e) { next(e); }
  }

  async getMyBalanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { PrismaClient } = await import('@hris/database');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { employee_id: true } });
      if (!user?.employee_id) throw new ApiError(404, 'Employee record not found');

      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getEmployeeBalances(user.employee_id, year);

      const summary = balances.reduce(
        (acc: Record<string, number>, balance: any) => {
          const code = String(balance.leave_type?.code || '').toLowerCase();
          if (code) acc[code] = Number(balance.remaining_days ?? 0);
          return acc;
        },
        {} as Record<string, number>
      );

      res.json({ success: true, data: summary });
    } catch (e) { next(e); }
  }

  async initializeBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.initializeBalances(employeeId, req.companyId!, year);
      res.status(201).json({ success: true, data: { balances }, message: 'Balances initialised' });
    } catch (e) { next(e); }
  }

  // ── Leave Requests ───────────────────────────────────
  async createLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { leaveTypeId, startDate, endDate, reason } = req.body;
      if (!leaveTypeId || !startDate || !endDate)
        throw new ApiError(400, 'leaveTypeId, startDate, and endDate are required');

      // Resolve employee_id from authenticated user
      const { PrismaClient } = await import('@hris/database');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { employee_id: true } });
      if (!user?.employee_id) throw new ApiError(404, 'Employee record not found');

      const request = await leaveService.createLeaveRequest({
        employeeId: user.employee_id,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      });

      res.status(201).json({ success: true, data: { leaveRequest: request }, message: 'Leave request submitted' });
    } catch (e) { next(e); }
  }

  async getLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, employeeId, year, page, limit } = req.query;
      const { requests, total } = await leaveService.getLeaveRequests({
        companyId: req.companyId!,
        employeeId: employeeId as string,
        status: status as string,
        year: year ? parseInt(year as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.json({ success: true, data: { requests, total } });
    } catch (e) { next(e); }
  }

  async getMyLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { PrismaClient } = await import('@hris/database');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { employee_id: true } });
      if (!user?.employee_id) throw new ApiError(404, 'Employee record not found');

      const { status, year, page, limit } = req.query;
      const { requests, total } = await leaveService.getLeaveRequests({
        employeeId: user.employee_id,
        status: status as string,
        year: year ? parseInt(year as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.json({ success: true, data: { requests, total } });
    } catch (e) { next(e); }
  }

  // ── Approve / Reject / Cancel ────────────────────────
  async approveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await leaveService.approveLeaveRequest(req.params.id, req.userId!);
      res.json({ success: true, data: { leaveRequest: updated }, message: 'Leave request approved' });
    } catch (e) { next(e); }
  }

  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      if (!reason) throw new ApiError(400, 'Rejection reason is required');
      const updated = await leaveService.rejectLeaveRequest(req.params.id, req.userId!, reason);
      res.json({ success: true, data: { leaveRequest: updated }, message: 'Leave request rejected' });
    } catch (e) { next(e); }
  }

  async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { PrismaClient } = await import('@hris/database');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { employee_id: true } });
      if (!user?.employee_id) throw new ApiError(404, 'Employee record not found');

      const updated = await leaveService.cancelLeaveRequest(req.params.id, user.employee_id);
      res.json({ success: true, data: { leaveRequest: updated }, message: 'Leave request cancelled' });
    } catch (e) { next(e); }
  }
}

export const leaveController = new LeaveController();
