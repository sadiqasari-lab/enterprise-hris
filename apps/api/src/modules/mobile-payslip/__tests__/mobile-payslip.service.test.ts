const mockUserFindUnique = jest.fn();
const mockGetEmployeePayslips = jest.fn();
const mockGetPayslip = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: mockUserFindUnique },
  })),
}));

jest.mock('../../payroll/payroll.service', () => ({
  payrollService: {
    getEmployeePayslips: mockGetEmployeePayslips,
    getPayslip: mockGetPayslip,
  },
}));

import { mobilePayslipService } from '../mobile-payslip.service';

describe('MobilePayslipService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns own payslips and summary', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      employee_id: 'emp-1',
    });
    mockGetEmployeePayslips.mockResolvedValue([
      {
        id: 'pr-1',
        cycle_id: 'cy-1',
        gross_salary: 15000,
        net_salary: 14000,
        total_deductions: 1000,
        cycle: { period_start: '2026-01-01T00:00:00.000Z', period_end: '2026-01-31T00:00:00.000Z' },
      },
      {
        id: 'pr-2',
        cycle_id: 'cy-2',
        gross_salary: 16000,
        net_salary: 15000,
        total_deductions: 1000,
        cycle: { period_start: '2025-12-01T00:00:00.000Z', period_end: '2025-12-31T00:00:00.000Z' },
      },
    ]);

    const result = await mobilePayslipService.getPayslips('user-1', '2026');

    expect(result.payslips).toHaveLength(1);
    expect(result.summary.totalGross).toBe(15000);
    expect(result.summary.count).toBe(1);
  });

  it('returns payslip detail for own cycle', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      employee_id: 'emp-1',
    });
    mockGetPayslip.mockResolvedValue({ id: 'pr-1', cycle_id: 'cy-1' });

    const result = await mobilePayslipService.getPayslipDetail('user-1', 'cy-1');

    expect(result.id).toBe('pr-1');
    expect(mockGetPayslip).toHaveBeenCalledWith('cy-1', 'emp-1');
  });

  it('throws when user has no employee link', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      employee_id: null,
    });

    await expect(mobilePayslipService.getPayslips('user-1')).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 })
    );
  });
});
