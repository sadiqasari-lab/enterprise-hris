/**
 * Employee Service – Unit Tests
 */
import { EmployeeService } from '../employee.service';

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockCount = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    department: { create: mockCreate, findFirst: mockFindFirst, findMany: mockFindMany },
    employee:   { create: mockCreate, findUnique: mockFindUnique, findFirst: mockFindFirst, findMany: mockFindMany, update: mockUpdate, count: mockCount },
    salaryStructure: { create: mockCreate, findUnique: mockFindUnique, update: mockUpdate },
  })),
}));

const service = new EmployeeService();

beforeEach(() => jest.clearAllMocks());

describe('EmployeeService', () => {
  describe('createDepartment', () => {
    it('throws 409 when department code already exists', async () => {
      mockFindFirst.mockResolvedValue({ id: 'dept-existing' });
      await expect(
        service.createDepartment('c1', { name: 'Eng', code: 'ENG' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    it('creates department when code is unique', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'dept-1', code: 'ENG' });
      const result = await service.createDepartment('c1', { name: 'Engineering', code: 'ENG' });
      expect(result.id).toBe('dept-1');
    });
  });

  describe('createEmployee', () => {
    it('throws 409 for duplicate employee number', async () => {
      mockFindFirst.mockResolvedValue({ id: 'emp-dup' });
      await expect(
        service.createEmployee('c1', {
          employeeNumber: 'E001', firstName: 'A', lastName: 'B',
          email: 'a@b.com', hireDate: new Date(), departmentId: 'd1', position: 'Dev',
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });
  });

  describe('getEmployeeById', () => {
    it('throws 404 for unknown ID', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.getEmployeeById('bad-id'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('softDeleteEmployee', () => {
    it('throws 404 for unknown employee', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.softDeleteEmployee('bad'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws 400 if already terminated', async () => {
      mockFindUnique.mockResolvedValue({ id: 'e1', status: 'TERMINATED' });
      await expect(service.softDeleteEmployee('e1'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('createSalaryStructure', () => {
    it('throws 404 for unknown employee', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(
        service.createSalaryStructure('bad', { basicSalary: 5000, effectiveFrom: new Date() })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getSalaryStructure', () => {
    it('throws 404 when salary structure does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.getSalaryStructure('emp-1'))
        .rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
