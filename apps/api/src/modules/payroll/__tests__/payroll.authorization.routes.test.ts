import express from 'express';
import request from 'supertest';
import payrollRoutes from '../payroll.routes';
import { errorHandler } from '../../../middleware/errorHandler';

function parseRoles(headerValue?: string): string[] {
  if (!headerValue) return [];
  return headerValue
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

jest.mock('../../auth/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    const roles = parseRoles(req.headers['x-roles'] as string | undefined);
    req.userId = 'user-1';
    req.companyId = 'company-1';
    req.user = {
      userId: 'user-1',
      companyId: 'company-1',
      roles,
      permissions: [],
    };
    next();
  },
}));

jest.mock('../payroll.controller', () => {
  const ok = (_req: any, res: any) => res.status(200).json({ success: true });
  return {
    payrollController: {
      createCycle: jest.fn(ok),
      addRecords: jest.fn(ok),
      submitForReview: jest.fn(ok),
      deleteCycle: jest.fn(ok),
      reviewPayroll: jest.fn(ok),
      gmApproval: jest.fn(ok),
      executePayroll: jest.fn(ok),
      getSummary: jest.fn(ok),
      getCycles: jest.fn(ok),
      getCycle: jest.fn(ok),
      getPayslip: jest.fn(ok),
      getMyPayslips: jest.fn(ok),
    },
  };
});

describe('Payroll authorization routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/payroll', payrollRoutes);
  app.use(errorHandler);

  it('blocks non-GM from /cycles/:id/gm-approval (403)', async () => {
    const res = await request(app)
      .post('/api/payroll/cycles/cycle-1/gm-approval')
      .set('x-roles', 'HR_ADMIN')
      .send({ approved: true });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('General Manager access required');
  });

  it('allows GM on /cycles/:id/gm-approval (200)', async () => {
    const res = await request(app)
      .post('/api/payroll/cycles/cycle-1/gm-approval')
      .set('x-roles', 'GM')
      .send({ approved: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('blocks non-HR_ADMIN from /cycles/:id/review (403)', async () => {
    const res = await request(app)
      .post('/api/payroll/cycles/cycle-1/review')
      .set('x-roles', 'EMPLOYEE')
      .send({ approved: true });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('HR Admin access required');
  });
});
