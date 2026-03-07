import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
import { LeaveService } from '../leave/leave.service';

const prisma = new PrismaClient();
const leaveService = new LeaveService();

interface MobileLeaveRequestInput {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

interface MobileLeaveListQuery {
  status?: string;
  year?: string | number;
  page?: string | number;
  limit?: string | number;
}

export class MobileLeaveService {
  private async resolveUser(userId: string): Promise<{
    userId: string;
    companyId: string;
    employeeId: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        company_id: true,
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
      companyId: user.company_id,
      employeeId: user.employee_id,
    };
  }

  async getLeaveTypes(userId: string): Promise<any> {
    const { companyId } = await this.resolveUser(userId);
    const leaveTypes = await leaveService.getLeaveTypes(companyId);
    return { leaveTypes };
  }

  async getBalances(userId: string, year?: string | number): Promise<any> {
    const { employeeId } = await this.resolveUser(userId);
    const parsedYear = year ? parseInt(String(year), 10) : new Date().getFullYear();
    const balances = await leaveService.getEmployeeBalances(employeeId, parsedYear);
    return {
      balances,
      year: parsedYear,
    };
  }

  async getMyRequests(userId: string, query: MobileLeaveListQuery): Promise<any> {
    const { employeeId } = await this.resolveUser(userId);

    const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20));
    const year = query.year ? parseInt(String(query.year), 10) : undefined;

    const { requests, total } = await leaveService.getLeaveRequests({
      employeeId,
      status: query.status,
      year,
      page,
      limit,
    });

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createRequest(userId: string, payload: MobileLeaveRequestInput): Promise<any> {
    const { employeeId } = await this.resolveUser(userId);

    if (!payload.leaveTypeId || !payload.startDate || !payload.endDate) {
      throw new ApiError(400, 'leaveTypeId, startDate, and endDate are required');
    }

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, 'Invalid leave dates');
    }

    if (startDate > endDate) {
      throw new ApiError(400, 'startDate cannot be after endDate');
    }

    const leaveRequest = await leaveService.createLeaveRequest({
      employeeId,
      leaveTypeId: payload.leaveTypeId,
      startDate,
      endDate,
      reason: payload.reason,
    });

    return leaveRequest;
  }

  async cancelRequest(userId: string, requestId: string): Promise<any> {
    const { employeeId } = await this.resolveUser(userId);
    return leaveService.cancelLeaveRequest(requestId, employeeId);
  }
}

export const mobileLeaveService = new MobileLeaveService();
