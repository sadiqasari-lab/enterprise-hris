/**
 * Recruitment Service – Unit Tests
 */
import { RecruitmentService } from '../recruitment.service';

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    jobPosting:       { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany, update: mockUpdate },
    applicant:        { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany, findFirst: mockFindFirst, update: mockUpdate },
    interview:        { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany, update: mockUpdate },
    interviewFeedback:{ create: mockCreate, findMany: mockFindMany },
    employee:         { create: mockCreate, findUnique: mockFindUnique },
    department:       { findUnique: mockFindUnique },
  })),
}));

const service = new RecruitmentService();

beforeEach(() => jest.clearAllMocks());

describe('RecruitmentService', () => {
  // ── createJobPosting ────────────────────────────────────────────────────
  describe('createJobPosting', () => {
    it('creates a posting with DRAFT status', async () => {
      mockFindUnique.mockResolvedValue({ id: 'dept-1' }); // department exists
      mockCreate.mockResolvedValue({ id: 'jp-1', status: 'DRAFT', title: 'Dev' });

      const result = await service.createJobPosting('company-1', {
        title:       'Dev',
        departmentId: 'dept-1',
        position:    'Software Developer',
      });

      expect(result.status).toBe('DRAFT');
    });

    it('throws 404 when department does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(
        service.createJobPosting('c1', { title: 'X', departmentId: 'bad', position: 'Y' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── updatePostingStatus ─────────────────────────────────────────────────
  describe('updatePostingStatus', () => {
    it('throws 404 for non-existent posting', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.updatePostingStatus('bad', 'PUBLISHED'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('allows DRAFT → PUBLISHED transition', async () => {
      mockFindUnique.mockResolvedValue({ id: 'jp-1', status: 'DRAFT' });
      mockUpdate.mockResolvedValue({ id: 'jp-1', status: 'PUBLISHED' });

      const result = await service.updatePostingStatus('jp-1', 'PUBLISHED');
      expect(result.status).toBe('PUBLISHED');
    });

    it('blocks invalid transition CLOSED → PUBLISHED', async () => {
      mockFindUnique.mockResolvedValue({ id: 'jp-1', status: 'CLOSED' });
      await expect(service.updatePostingStatus('jp-1', 'PUBLISHED'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  // ── createApplicant ─────────────────────────────────────────────────────
  describe('createApplicant', () => {
    it('throws 404 when posting is not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(
        service.createApplicant('bad-jp', { firstName: 'A', lastName: 'B', email: 'a@b.com' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws 400 when posting is not PUBLISHED', async () => {
      mockFindUnique.mockResolvedValue({ id: 'jp-1', status: 'CLOSED' });
      await expect(
        service.createApplicant('jp-1', { firstName: 'A', lastName: 'B', email: 'a@b.com' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('throws 409 for duplicate email on same posting', async () => {
      mockFindUnique.mockResolvedValue({ id: 'jp-1', status: 'PUBLISHED' });
      mockFindFirst.mockResolvedValue({ id: 'existing' }); // duplicate

      await expect(
        service.createApplicant('jp-1', { firstName: 'A', lastName: 'B', email: 'dup@email.com' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  // ── updateApplicantStatus ───────────────────────────────────────────────
  describe('updateApplicantStatus', () => {
    it('throws 404 for unknown applicant', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.updateApplicantStatus('bad', 'SCREENING'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── scheduleInterview ───────────────────────────────────────────────────
  describe('scheduleInterview', () => {
    it('validates interview type', async () => {
      mockFindUnique.mockResolvedValue({ id: 'app-1', status: 'SCREENING' });
      await expect(
        service.scheduleInterview('app-1', { type: 'INVALID', scheduledDate: new Date(), interviewerIds: ['i1'] })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  // ── hireApplicant ───────────────────────────────────────────────────────
  describe('hireApplicant', () => {
    it('throws 404 for non-existent applicant', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.hireApplicant('bad', { departmentId: 'd1', position: 'Dev', employeeNumber: 'E001' }))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws 400 if applicant is not in OFFER stage', async () => {
      mockFindUnique.mockResolvedValue({ id: 'app-1', status: 'SCREENING' });
      await expect(service.hireApplicant('app-1', { departmentId: 'd1', position: 'Dev', employeeNumber: 'E001' }))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
