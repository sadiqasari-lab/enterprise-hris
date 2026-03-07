var mockPayrollCycleFindUnique: any;
var mockPayrollCycleUpdate: any;
var mockUserFindUnique: any;
var mockTransaction: any;

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => {
    if (!mockPayrollCycleFindUnique) mockPayrollCycleFindUnique = jest.fn();
    if (!mockPayrollCycleUpdate) mockPayrollCycleUpdate = jest.fn();
    if (!mockUserFindUnique) mockUserFindUnique = jest.fn();
    if (!mockTransaction) mockTransaction = jest.fn();

    return {
      payrollCycle: {
        findUnique: mockPayrollCycleFindUnique,
        update: mockPayrollCycleUpdate,
      },
      user: {
        findUnique: mockUserFindUnique,
      },
      $transaction: mockTransaction,
    };
  }),
}));

import { PayrollService } from '../payroll.service';

describe('PayrollService workflow guards', () => {
  const service = new PayrollService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects gmApproval when caller is not GM', async () => {
    mockPayrollCycleFindUnique.mockResolvedValueOnce({ id: 'cy-1', status: 'PENDING_GM_APPROVAL' });
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', user_roles: [{ role: { name: 'HR_ADMIN' } }] });

    await expect(service.gmApproval('cy-1', 'user-1', true)).rejects.toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('locks payroll on GM approve', async () => {
    mockPayrollCycleFindUnique.mockResolvedValueOnce({ id: 'cy-1', status: 'PENDING_GM_APPROVAL' });
    mockUserFindUnique.mockResolvedValue({ id: 'gm-1', user_roles: [{ role: { name: 'GM' } }] });
    mockPayrollCycleUpdate.mockResolvedValue({ id: 'cy-1', status: 'APPROVED', is_locked: true });

    const result = await service.gmApproval('cy-1', 'gm-1', true);

    expect(mockPayrollCycleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cy-1' },
        data: expect.objectContaining({
          status: 'APPROVED',
          approved_by_gm: 'gm-1',
          is_locked: true,
        }),
      })
    );
    expect(result.status).toBe('APPROVED');
  });

  it('rejects executePayroll when cycle is not APPROVED', async () => {
    mockPayrollCycleFindUnique.mockResolvedValue({
      id: 'cy-1',
      status: 'PENDING_GM_APPROVAL',
      approved_by_gm: null,
      is_locked: false,
      records: [],
    });

    await expect(service.executePayroll('cy-1', 'hr-1')).rejects.toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('rejects executePayroll when GM approval is missing even if status APPROVED', async () => {
    mockPayrollCycleFindUnique.mockResolvedValue({
      id: 'cy-1',
      status: 'APPROVED',
      approved_by_gm: null,
      is_locked: true,
      records: [],
    });

    await expect(service.executePayroll('cy-1', 'hr-1')).rejects.toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});
