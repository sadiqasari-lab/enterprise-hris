import { ApiError } from '../../../middleware/errorHandler';

const mockUserFindUnique = jest.fn();
const mockEmployeeUpdate = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: mockUserFindUnique },
    employee: { update: mockEmployeeUpdate },
  })),
}));

import { mobileProfileService } from '../mobile-profile.service';

describe('MobileProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns profile payload for linked employee user', async () => {
    mockUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'employee@company.com',
        is_active: true,
        last_login: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        employee_id: 'emp-1',
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'employee@company.com',
        is_active: true,
        last_login: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        employee: {
          id: 'emp-1',
          employee_number: 'EMP001',
          first_name: 'Aisha',
          last_name: 'Ali',
          email: 'aisha.ali@company.com',
          phone: '+966555000123',
          position: 'Software Engineer',
          hire_date: new Date('2024-01-15T00:00:00.000Z'),
          status: 'ACTIVE',
          date_of_birth: new Date('1995-02-03T00:00:00.000Z'),
          nationality: 'Saudi',
          department: { id: 'dep-1', name: 'Engineering' },
          manager: { id: 'mgr-1', first_name: 'Omar', last_name: 'Khan' },
        },
      });

    const result = await mobileProfileService.getProfile('user-1');

    expect(result.user.email).toBe('employee@company.com');
    expect(result.employee.fullName).toBe('Aisha Ali');
    expect(result.employee.manager.fullName).toBe('Omar Khan');
  });

  it('updates editable profile fields', async () => {
    mockUserFindUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'employee@company.com',
        is_active: true,
        last_login: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        employee_id: 'emp-1',
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'employee@company.com',
        is_active: true,
        last_login: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        employee_id: 'emp-1',
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'employee@company.com',
        is_active: true,
        last_login: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        employee: {
          id: 'emp-1',
          employee_number: 'EMP001',
          first_name: 'Sara',
          last_name: 'Hassan',
          email: 'sara.hassan@company.com',
          phone: '+966500000999',
          position: 'Engineer',
          hire_date: new Date('2024-01-15T00:00:00.000Z'),
          status: 'ACTIVE',
          date_of_birth: null,
          nationality: 'Jordanian',
          department: { id: 'dep-1', name: 'Engineering' },
          manager: null,
        },
      });
    mockEmployeeUpdate.mockResolvedValue({ id: 'emp-1' });

    const result = await mobileProfileService.updateProfile('user-1', {
      firstName: 'Sara',
      lastName: 'Hassan',
      phone: '+966500000999',
      nationality: 'Jordanian',
      dateOfBirth: '1996-05-10',
    });

    expect(mockEmployeeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'emp-1' },
        data: expect.objectContaining({
          first_name: 'Sara',
          last_name: 'Hassan',
          phone: '+966500000999',
          nationality: 'Jordanian',
        }),
      })
    );
    expect(result.employee.firstName).toBe('Sara');
  });

  it('throws 400 when update payload has no editable fields', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'employee@company.com',
      is_active: true,
      last_login: null,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      employee_id: 'emp-1',
    });

    await expect(mobileProfileService.updateProfile('user-1', {})).rejects.toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  it('throws 404 for user without employee link', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'employee@company.com',
      is_active: true,
      last_login: null,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      employee_id: null,
    });

    await expect(mobileProfileService.getProfile('user-1')).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 })
    );
  });

  it('throws 400 for invalid dateOfBirth', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'employee@company.com',
      is_active: true,
      last_login: null,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      employee_id: 'emp-1',
    });

    await expect(
      mobileProfileService.updateProfile('user-1', { dateOfBirth: 'invalid-date' })
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});
