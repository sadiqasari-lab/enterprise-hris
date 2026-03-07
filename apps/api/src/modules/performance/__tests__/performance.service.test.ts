/**
 * Performance Service – Unit Tests
 */
import { PerformanceService } from '../performance.service';

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockCount = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    performanceCycle: { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany, update: mockUpdate },
    goal:            { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany, update: mockUpdate },
    appraisal:       { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany, update: mockUpdate, count: mockCount, aggregate: jest.fn() },
    employee:        { findUnique: mockFindUnique },
  })),
}));

const service = new PerformanceService();

beforeEach(() => jest.clearAllMocks());

describe('PerformanceService', () => {
  // ── createCycle ──────────────────────────────────────────────────────────
  describe('createCycle', () => {
    it('throws 400 when startDate >= endDate', async () => {
      await expect(
        service.createCycle('company-1', {
          name: 'Q1 Review',
          cycleType: 'QUARTERLY',
          startDate: new Date('2026-04-01'),
          endDate:   new Date('2026-03-01'),
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('creates a cycle successfully', async () => {
      mockCreate.mockResolvedValue({ id: 'cyc-1', name: 'Q1 Review', status: 'ACTIVE' });

      const result = await service.createCycle('company-1', {
        name:      'Q1 Review',
        cycleType: 'QUARTERLY',
        startDate: new Date('2026-01-01'),
        endDate:   new Date('2026-03-31'),
      });

      expect(result.id).toBe('cyc-1');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  // ── completeCycle ────────────────────────────────────────────────────────
  describe('completeCycle', () => {
    it('throws 404 when cycle not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.completeCycle('bad-id'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws 400 if cycle is already COMPLETED', async () => {
      mockFindUnique.mockResolvedValue({ id: 'cyc-1', status: 'COMPLETED' });
      await expect(service.completeCycle('cyc-1'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  // ── createGoal ───────────────────────────────────────────────────────────
  describe('createGoal', () => {
    it('throws 404 when employee not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(
        service.createGoal('bad-emp', {
          title:      'Improve coverage',
          cycleId:    'cyc-1',
          targetDate: new Date('2026-03-31'),
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws 404 when cycle not found', async () => {
      // employee found, cycle not
      mockFindUnique
        .mockResolvedValueOnce({ id: 'emp-1' })   // employee
        .mockResolvedValueOnce(null);              // cycle
      await expect(
        service.createGoal('emp-1', {
          title:      'Improve coverage',
          cycleId:    'bad-cycle',
          targetDate: new Date('2026-03-31'),
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── updateGoalProgress ─────────────────────────────────────────────────────
  describe('updateGoalProgress', () => {
    it('clamps progress to [0, 100]', async () => {
      mockFindUnique.mockResolvedValue({ id: 'goal-1', progress: 50, status: 'IN_PROGRESS' });
      mockUpdate.mockResolvedValue({ id: 'goal-1', progress: 100 });

      await service.updateGoalProgress('goal-1', 150); // should clamp to 100
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ progress: 100 }) })
      );
    });

    it('throws 404 for unknown goal', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.updateGoalProgress('bad', 50))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── submitAppraisal ──────────────────────────────────────────────────────
  describe('submitAppraisal', () => {
    it('throws 400 for rating outside 1-5', async () => {
      mockFindUnique.mockResolvedValue({ id: 'app-1', status: 'DRAFT' });
      await expect(
        service.submitAppraisal('app-1', { rating: 7, feedback: 'Great' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('throws 400 for rating 0', async () => {
      mockFindUnique.mockResolvedValue({ id: 'app-1', status: 'DRAFT' });
      await expect(
        service.submitAppraisal('app-1', { rating: 0, feedback: 'X' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  // ── acknowledgeAppraisal ───────────────────────────────────────────────────
  describe('acknowledgeAppraisal', () => {
    it('throws 400 if appraisal status is not SUBMITTED', async () => {
      mockFindUnique.mockResolvedValue({ id: 'app-1', status: 'DRAFT' });
      await expect(service.acknowledgeAppraisal('app-1'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
