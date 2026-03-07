const mockUserFindUnique = jest.fn();
const mockGetLeaveTypes = jest.fn();
const mockGetEmployeeBalances = jest.fn();
const mockGetLeaveRequests = jest.fn();
const mockCreateLeaveRequest = jest.fn();
const mockCancelLeaveRequest = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: mockUserFindUnique },
  })),
}));

jest.mock('../../leave/leave.service', () => ({
  LeaveService: jest.fn().mockImplementation(() => ({
    getLeaveTypes: mockGetLeaveTypes,
    getEmployeeBalances: mockGetEmployeeBalances,
    getLeaveRequests: mockGetLeaveRequests,
    createLeaveRequest: mockCreateLeaveRequest,
    cancelLeaveRequest: mockCancelLeaveRequest,
  })),
}));

import { mobileLeaveService } from '../mobile-leave.service';

describe('MobileLeaveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns leave types for authenticated user company', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      employee_id: 'emp-1',
    });
    mockGetLeaveTypes.mockResolvedValue([{ id: 'lt-1', code: 'ANNUAL' }]);

    const result = await mobileLeaveService.getLeaveTypes('user-1');

    expect(result.leaveTypes).toHaveLength(1);
    expect(mockGetLeaveTypes).toHaveBeenCalledWith('company-1');
  });

  it('returns own leave balances for selected year', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      employee_id: 'emp-1',
    });
    mockGetEmployeeBalances.mockResolvedValue([{ id: 'bal-1' }]);

    const result = await mobileLeaveService.getBalances('user-1', '2026');

    expect(result.year).toBe(2026);
    expect(result.balances).toHaveLength(1);
    expect(mockGetEmployeeBalances).toHaveBeenCalledWith('emp-1', 2026);
  });

  it('returns paginated own requests', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      employee_id: 'emp-1',
    });
    mockGetLeaveRequests.mockResolvedValue({
      requests: [{ id: 'req-1', status: 'PENDING' }],
      total: 12,
    });

    const result = await mobileLeaveService.getMyRequests('user-1', {
      status: 'PENDING',
      page: '2',
      limit: '5',
    });

    expect(result.requests).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
  });

  it('creates request for authenticated employee', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      employee_id: 'emp-1',
    });
    mockCreateLeaveRequest.mockResolvedValue({ id: 'req-1' });

    const result = await mobileLeaveService.createRequest('user-1', {
      leaveTypeId: 'lt-1',
      startDate: '2026-03-10',
      endDate: '2026-03-12',
      reason: 'Family travel',
    });

    expect(result.id).toBe('req-1');
    expect(mockCreateLeaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
      })
    );
  });

  it('cancels own leave request', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      employee_id: 'emp-1',
    });
    mockCancelLeaveRequest.mockResolvedValue({ id: 'req-1', status: 'CANCELLED' });

    const result = await mobileLeaveService.cancelRequest('user-1', 'req-1');

    expect(result.status).toBe('CANCELLED');
    expect(mockCancelLeaveRequest).toHaveBeenCalledWith('req-1', 'emp-1');
  });

  it('throws 404 when user has no linked employee', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      company_id: 'company-1',
      employee_id: null,
    });

    await expect(mobileLeaveService.getLeaveTypes('user-1')).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 })
    );
  });
});
