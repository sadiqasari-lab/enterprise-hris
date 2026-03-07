import { ApiError } from '../../../middleware/errorHandler';

const mockUserFindUnique = jest.fn();
const mockLocationFindFirst = jest.fn();
const mockRecordFindFirst = jest.fn();
const mockRecordFindMany = jest.fn();
const mockRecordCount = jest.fn();
const mockCheckIn = jest.fn();
const mockCheckOut = jest.fn();

jest.mock('@hris/database', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: mockUserFindUnique },
    attendanceLocation: { findFirst: mockLocationFindFirst },
    attendanceRecord: {
      findFirst: mockRecordFindFirst,
      findMany: mockRecordFindMany,
      count: mockRecordCount,
    },
  })),
}));

jest.mock('../../attendance/attendance.service', () => ({
  attendanceService: {
    checkIn: mockCheckIn,
    checkOut: mockCheckOut,
  },
}));

import { mobileAttendanceService } from '../mobile-attendance.service';

describe('MobileAttendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('resolves employee + default location and forwards to attendance service', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        company_id: 'company-1',
        employee_id: 'emp-1',
      });
      mockLocationFindFirst.mockResolvedValue({ id: 'loc-1' });
      mockCheckIn.mockResolvedValue({ success: true, message: 'ok' });

      const result = await mobileAttendanceService.checkIn('user-1', {
        gps: { latitude: 24.7, longitude: 46.7, accuracy: 10 },
        deviceInfo: { model: 'iPhone', os: 'iOS', fingerprint: 'abc' },
      });

      expect(result.success).toBe(true);
      expect(mockCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-1',
          locationId: 'loc-1',
        })
      );
    });

    it('throws 400 when no location can be resolved', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        company_id: 'company-1',
        employee_id: 'emp-1',
      });
      mockLocationFindFirst.mockResolvedValue(null);

      await expect(
        mobileAttendanceService.checkIn('user-1', {
          gps: { latitude: 24.7, longitude: 46.7 },
        })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('checkOut', () => {
    it('resolves employee and calls attendance check-out', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        company_id: 'company-1',
        employee_id: 'emp-1',
      });
      mockCheckOut.mockResolvedValue({ success: true, message: 'Checked out' });

      const result = await mobileAttendanceService.checkOut('user-1');

      expect(result.success).toBe(true);
      expect(mockCheckOut).toHaveBeenCalledWith('emp-1', expect.any(Date));
    });
  });

  describe('getStatus', () => {
    it('returns checked-in status when open record exists', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        company_id: 'company-1',
        employee_id: 'emp-1',
      });
      mockLocationFindFirst.mockResolvedValue({ id: 'loc-1' });
      mockRecordFindFirst
        .mockResolvedValueOnce({ id: 'open-1', check_out_time: null }) // openRecord
        .mockResolvedValueOnce({ id: 'last-1' }); // lastRecord

      const status = await mobileAttendanceService.getStatus('user-1');

      expect(status.checkedIn).toBe(true);
      expect(status.canCheckOut).toBe(true);
      expect(status.defaultLocationId).toBe('loc-1');
      expect(status.openRecord.id).toBe('open-1');
    });
  });

  describe('getHistory', () => {
    it('returns paginated history with filters', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        company_id: 'company-1',
        employee_id: 'emp-1',
      });
      mockRecordFindMany.mockResolvedValue([{ id: 'rec-1', status: 'FLAGGED' }]);
      mockRecordCount.mockResolvedValue(21);

      const result = await mobileAttendanceService.getHistory('user-1', {
        status: 'FLAGGED',
        page: '2',
        limit: '10',
      });

      expect(result.records).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3,
      });
      expect(mockRecordFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: expect.objectContaining({
            employee_id: 'emp-1',
            company_id: 'company-1',
            status: 'FLAGGED',
          }),
        })
      );
    });
  });

  describe('resolve employee', () => {
    it('throws 404 when user has no linked employee', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        company_id: 'company-1',
        employee_id: null,
      });

      await expect(mobileAttendanceService.getStatus('user-1')).rejects.toThrow(
        expect.objectContaining({ statusCode: 404 })
      );
    });
  });
});
