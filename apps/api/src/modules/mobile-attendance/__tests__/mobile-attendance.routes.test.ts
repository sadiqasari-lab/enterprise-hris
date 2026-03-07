import express from 'express';
import request from 'supertest';
import mobileAttendanceRoutes from '../mobile-attendance.routes';
import { errorHandler, ApiError } from '../../../middleware/errorHandler';
import { mobileAttendanceService } from '../mobile-attendance.service';

jest.mock('../../auth/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    req.companyId = 'company-1';
    next();
  },
}));

jest.mock('../mobile-attendance.service', () => ({
  mobileAttendanceService: {
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    getStatus: jest.fn(),
    getHistory: jest.fn(),
  },
}));

describe('MobileAttendanceRoutes', () => {
  const mockCheckIn = mobileAttendanceService.checkIn as jest.Mock;
  const mockCheckOut = mobileAttendanceService.checkOut as jest.Mock;
  const mockGetStatus = mobileAttendanceService.getStatus as jest.Mock;
  const mockGetHistory = mobileAttendanceService.getHistory as jest.Mock;
  const app = express();
  app.use(express.json());
  app.use('/api/mobile/attendance', mobileAttendanceRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /check-in returns 200 on successful check-in', async () => {
    mockCheckIn.mockResolvedValue({
      success: true,
      record: { id: 'rec-1' },
      validation: { isValid: true },
      message: 'Check-in successful',
    });

    const res = await request(app)
      .post('/api/mobile/attendance/check-in')
      .send({ locationId: 'loc-1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.id).toBe('rec-1');
  });

  it('POST /check-in returns 400 when service blocks check-in', async () => {
    mockCheckIn.mockResolvedValue({
      success: false,
      validation: { isValid: false },
      message: 'Check-in blocked',
    });

    const res = await request(app)
      .post('/api/mobile/attendance/check-in')
      .send({ locationId: 'loc-1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /check-out returns 200 and payload', async () => {
    mockCheckOut.mockResolvedValue({
      success: true,
      record: { id: 'rec-1' },
      message: 'Check-out successful',
    });

    const res = await request(app).post('/api/mobile/attendance/check-out');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record.id).toBe('rec-1');
  });

  it('GET /status returns mobile attendance status', async () => {
    mockGetStatus.mockResolvedValue({
      checkedIn: true,
      canCheckOut: true,
      openRecord: { id: 'open-1' },
    });

    const res = await request(app).get('/api/mobile/attendance/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkedIn).toBe(true);
  });

  it('GET /history returns records and pagination', async () => {
    mockGetHistory.mockResolvedValue({
      records: [{ id: 'rec-1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const res = await request(app).get('/api/mobile/attendance/history?page=1&limit=20');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('returns structured error payload when service throws', async () => {
    mockGetStatus.mockRejectedValue(new ApiError(400, 'Bad mobile request'));

    const res = await request(app).get('/api/mobile/attendance/status');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Bad mobile request');
  });
});
