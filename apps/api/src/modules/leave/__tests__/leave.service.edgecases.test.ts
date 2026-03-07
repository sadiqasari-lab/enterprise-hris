var mockEmployeeFindUnique: any;
var mockLeaveTypeFindUnique: any;
var mockHolidayFindMany: any;
var mockLeaveBalanceFindUnique: any;
var mockLeaveRequestFindFirst: any;
var mockLeaveRequestCreate: any;
var mockLeaveBalanceUpdate: any;
var mockLeaveRequestFindMany: any;
var mockLeaveRequestCount: any;

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => {
    if (!mockEmployeeFindUnique) mockEmployeeFindUnique = jest.fn();
    if (!mockLeaveTypeFindUnique) mockLeaveTypeFindUnique = jest.fn();
    if (!mockHolidayFindMany) mockHolidayFindMany = jest.fn();
    if (!mockLeaveBalanceFindUnique) mockLeaveBalanceFindUnique = jest.fn();
    if (!mockLeaveRequestFindFirst) mockLeaveRequestFindFirst = jest.fn();
    if (!mockLeaveRequestCreate) mockLeaveRequestCreate = jest.fn();
    if (!mockLeaveBalanceUpdate) mockLeaveBalanceUpdate = jest.fn();
    if (!mockLeaveRequestFindMany) mockLeaveRequestFindMany = jest.fn();
    if (!mockLeaveRequestCount) mockLeaveRequestCount = jest.fn();

    return {
      employee: { findUnique: mockEmployeeFindUnique },
      leaveType: { findUnique: mockLeaveTypeFindUnique },
      holiday: { findMany: mockHolidayFindMany },
      leaveBalance: { findUnique: mockLeaveBalanceFindUnique, update: mockLeaveBalanceUpdate },
      leaveRequest: {
        findFirst: mockLeaveRequestFindFirst,
        create: mockLeaveRequestCreate,
        findMany: mockLeaveRequestFindMany,
        count: mockLeaveRequestCount,
      },
    };
  }),
}));

import { LeaveService } from '../leave.service';

describe('LeaveService edge cases', () => {
  const service = new LeaveService();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects leave request when start date is in the past', async () => {
    mockEmployeeFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'company-1' });
    mockLeaveTypeFindUnique.mockResolvedValue({ id: 'lt-1', requires_approval: true });

    await expect(
      service.createLeaveRequest({
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: new Date('2025-12-20T00:00:00.000Z'),
        endDate: new Date('2025-12-22T00:00:00.000Z'),
      })
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects leave request when selected range has zero working days', async () => {
    mockEmployeeFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'company-1' });
    mockLeaveTypeFindUnique.mockResolvedValue({ id: 'lt-1', requires_approval: true });
    mockHolidayFindMany.mockResolvedValue([]);

    await expect(
      service.createLeaveRequest({
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        startDate: new Date('2026-03-06T00:00:00.000Z'),
        endDate: new Date('2026-03-07T00:00:00.000Z'),
      })
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it('auto-approves and deducts balance when leave type does not require approval', async () => {
    mockEmployeeFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'company-1' });
    mockLeaveTypeFindUnique.mockResolvedValue({ id: 'lt-1', requires_approval: false });
    mockHolidayFindMany.mockResolvedValue([]);
    mockLeaveBalanceFindUnique.mockResolvedValue({ remaining_days: 10 });
    mockLeaveRequestFindFirst.mockResolvedValue(null);
    mockLeaveRequestCreate.mockResolvedValue({ id: 'req-1', status: 'APPROVED', total_days: 1 });
    mockLeaveBalanceUpdate.mockResolvedValue({});

    const result = await service.createLeaveRequest({
      employeeId: 'emp-1',
      leaveTypeId: 'lt-1',
      startDate: new Date('2026-03-08T00:00:00.000Z'),
      endDate: new Date('2026-03-08T00:00:00.000Z'),
      reason: 'Medical',
    });

    expect(result.status).toBe('APPROVED');
    expect(mockLeaveBalanceUpdate).toHaveBeenCalledTimes(1);
  });

  it('applies year + pagination filters in getLeaveRequests', async () => {
    mockLeaveRequestFindMany.mockResolvedValue([{ id: 'req-1' }]);
    mockLeaveRequestCount.mockResolvedValue(1);

    await service.getLeaveRequests({
      employeeId: 'emp-1',
      year: 2026,
      page: 2,
      limit: 5,
    });

    expect(mockLeaveRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employee_id: 'emp-1',
          start_date: { gte: new Date('2026-01-01') },
          end_date: { lte: new Date('2026-12-31') },
        }),
        skip: 5,
        take: 5,
      })
    );
  });
});
