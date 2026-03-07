import express from 'express';
import request from 'supertest';
import { ApiError, errorHandler } from '../../../middleware/errorHandler';
import mobilePayslipRoutes from '../mobile-payslip.routes';
import { mobilePayslipService } from '../mobile-payslip.service';

jest.mock('../../auth/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    req.companyId = 'company-1';
    next();
  },
}));

jest.mock('../mobile-payslip.service', () => ({
  mobilePayslipService: {
    getPayslips: jest.fn(),
    getPayslipDetail: jest.fn(),
  },
}));

describe('MobilePayslipRoutes', () => {
  const mockGetPayslips = mobilePayslipService.getPayslips as jest.Mock;
  const mockGetPayslipDetail = mobilePayslipService.getPayslipDetail as jest.Mock;
  const app = express();
  app.use(express.json());
  app.use('/api/mobile/payslips', mobilePayslipRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / returns payslip list + summary', async () => {
    mockGetPayslips.mockResolvedValue({
      payslips: [{ id: 'pr-1' }],
      summary: { totalGross: 15000, totalNet: 14000, totalDeductions: 1000, count: 1 },
    });

    const res = await request(app).get('/api/mobile/payslips');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payslips).toHaveLength(1);
  });

  it('GET /:cycleId returns payslip detail', async () => {
    mockGetPayslipDetail.mockResolvedValue({ id: 'pr-1', cycle_id: 'cy-1' });

    const res = await request(app).get('/api/mobile/payslips/cy-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payslip.id).toBe('pr-1');
  });

  it('returns structured API error response', async () => {
    mockGetPayslipDetail.mockRejectedValue(new ApiError(404, 'Payslip not found'));

    const res = await request(app).get('/api/mobile/payslips/cy-1');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Payslip not found');
  });
});
