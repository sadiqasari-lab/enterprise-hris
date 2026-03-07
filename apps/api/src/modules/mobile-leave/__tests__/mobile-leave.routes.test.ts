import express from 'express';
import request from 'supertest';
import { ApiError, errorHandler } from '../../../middleware/errorHandler';
import mobileLeaveRoutes from '../mobile-leave.routes';
import { mobileLeaveService } from '../mobile-leave.service';

jest.mock('../../auth/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    req.companyId = 'company-1';
    next();
  },
}));

jest.mock('../mobile-leave.service', () => ({
  mobileLeaveService: {
    getLeaveTypes: jest.fn(),
    getBalances: jest.fn(),
    getMyRequests: jest.fn(),
    createRequest: jest.fn(),
    cancelRequest: jest.fn(),
  },
}));

describe('MobileLeaveRoutes', () => {
  const mockGetLeaveTypes = mobileLeaveService.getLeaveTypes as jest.Mock;
  const mockGetBalances = mobileLeaveService.getBalances as jest.Mock;
  const mockGetMyRequests = mobileLeaveService.getMyRequests as jest.Mock;
  const mockCreateRequest = mobileLeaveService.createRequest as jest.Mock;
  const mockCancelRequest = mobileLeaveService.cancelRequest as jest.Mock;
  const app = express();
  app.use(express.json());
  app.use('/api/mobile/leave', mobileLeaveRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /types returns leave types', async () => {
    mockGetLeaveTypes.mockResolvedValue({ leaveTypes: [{ id: 'lt-1', code: 'ANNUAL' }] });

    const res = await request(app).get('/api/mobile/leave/types');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leaveTypes).toHaveLength(1);
  });

  it('GET /requests returns paginated requests', async () => {
    mockGetMyRequests.mockResolvedValue({
      requests: [{ id: 'req-1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const res = await request(app).get('/api/mobile/leave/requests?page=1&limit=20');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('POST /requests creates leave request', async () => {
    mockCreateRequest.mockResolvedValue({ id: 'req-1', status: 'PENDING' });

    const res = await request(app).post('/api/mobile/leave/requests').send({
      leaveTypeId: 'lt-1',
      startDate: '2026-03-10',
      endDate: '2026-03-11',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leaveRequest.id).toBe('req-1');
  });

  it('POST /requests/:id/cancel cancels leave request', async () => {
    mockCancelRequest.mockResolvedValue({ id: 'req-1', status: 'CANCELLED' });

    const res = await request(app).post('/api/mobile/leave/requests/req-1/cancel');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leaveRequest.status).toBe('CANCELLED');
  });

  it('returns structured API error response', async () => {
    mockGetBalances.mockRejectedValue(new ApiError(400, 'Invalid year'));

    const res = await request(app).get('/api/mobile/leave/balances?year=bad');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid year');
  });
});
