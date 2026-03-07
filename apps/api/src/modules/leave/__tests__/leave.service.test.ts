/**
 * Leave Service – Unit Tests
 * Mocks Prisma; validates business logic in isolation.
 */
import { LeaveService } from '../leave.service';
import { ApiError } from '../../../middleware/errorHandler';

// ── Prisma mock ──────────────────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockCount = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    leaveType: { create: mockCreate, findMany: mockFindMany, findFirst: mockFindFirst, findUnique: mockFindUnique },
    leaveBalance: { create: mockCreate, findFirst: mockFindFirst, findMany: mockFindMany, findUnique: mockFindUnique, update: mockUpdate },
    leaveRequest: { create: mockCreate, findMany: mockFindMany, findFirst: mockFindFirst, findUnique: mockFindUnique, update: mockUpdate, count: mockCount },
    employee: { findUnique: mockFindUnique },
  })),
}));

const service = new LeaveService();

// ── helper ───────────────────────────────────────────────────────────────────
function resetMocks() {
  jest.clearAllMocks();
}

describe('LeaveService', () => {
  beforeEach(resetMocks);

  // ── createLeaveType ────────────────────────────────────────────────────────
  describe('createLeaveType', () => {
    it('creates a new leave type when code is unique', async () => {
      mockFindFirst.mockResolvedValue(null); // no duplicate
      mockCreate.mockResolvedValue({ id: 'lt-1', code: 'AL', name: 'Annual Leave' });

      const result = await service.createLeaveType('company-1', {
        name: 'Annual Leave',
        nameAr: 'إجازة سنوية',
        code: 'AL',
        daysPerYear: 30,
        isPaid: true,
      });

      expect(result.id).toBe('lt-1');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('throws 409 when code already exists', async () => {
      mockFindFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createLeaveType('company-1', { name: 'X', code: 'AL', daysPerYear: 30, isPaid: true })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  // ── initializeBalance ──────────────────────────────────────────────────────
  describe('initializeBalance', () => {
    it('creates balance for employee + type + year when none exists', async () => {
      // employee exists
      mockFindUnique.mockImplementation((args: any) => {
        if (args?.where?.id === 'emp-1') return Promise.resolve({ id: 'emp-1', company_id: 'c1' });
        return Promise.resolve(null);
      });
      // leave type exists
      mockFindFirst.mockResolvedValue({ id: 'lt-1', days_per_year: 30 });
      // no existing balance
      mockFindFirst.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValue({ id: 'bal-1', total_days: 30, used_days: 0, remaining_days: 30 });

      const result = await service.initializeBalance('emp-1', 'lt-1', 2026);
      expect(result.total_days).toBe(30);
    });

    it('throws 404 when employee does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.initializeBalance('bad-id', 'lt-1', 2026))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── createLeaveRequest ─────────────────────────────────────────────────────
  describe('createLeaveRequest', () => {
    const validInput = {
      employeeId: 'emp-1',
      leaveTypeId: 'lt-1',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-12'),
      reason: 'Personal',
    };

    it('rejects when startDate > endDate', async () => {
      await expect(
        service.createLeaveRequest({
          ...validInput,
          startDate: new Date('2026-02-15'),
          endDate: new Date('2026-02-10'),
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects when balance is insufficient', async () => {
      // employee exists
      mockFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'c1' });
      // leave type exists
      mockFindFirst.mockResolvedValue({ id: 'lt-1' });
      // balance insufficient
      mockFindFirst.mockResolvedValueOnce({ id: 'bal-1', remaining_days: 1 }); // only 1 day left
      // no overlapping requests
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(service.createLeaveRequest(validInput))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects when there is an overlapping request', async () => {
      mockFindUnique.mockResolvedValue({ id: 'emp-1', company_id: 'c1' });
      mockFindFirst
        .mockResolvedValueOnce({ id: 'lt-1' })      // leave type
        .mockResolvedValueOnce({ remaining_days: 30 })  // balance OK
        .mockResolvedValueOnce({ id: 'existing-req' }); // overlap!

      await expect(service.createLeaveRequest(validInput))
        .rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  // ── approveLeaveRequest ────────────────────────────────────────────────────
  describe('approveLeaveRequest', () => {
    it('throws 404 for non-existent request', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.approveLeaveRequest('bad-id', 'approver'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws 400 if request is not PENDING', async () => {
      mockFindUnique.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });
      await expect(service.approveLeaveRequest('req-1', 'approver'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  // ── rejectLeaveRequest ─────────────────────────────────────────────────────
  describe('rejectLeaveRequest', () => {
    it('throws 400 if request is not PENDING', async () => {
      mockFindUnique.mockResolvedValue({ id: 'req-1', status: 'REJECTED' });
      await expect(service.rejectLeaveRequest('req-1', 'approver', 'Staffing'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  // ── cancelLeaveRequest ─────────────────────────────────────────────────────
  describe('cancelLeaveRequest', () => {
    it('throws 400 when trying to cancel a REJECTED request', async () => {
      mockFindUnique.mockResolvedValue({ id: 'req-1', status: 'REJECTED' });
      await expect(service.cancelLeaveRequest('req-1', 'emp-1'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
