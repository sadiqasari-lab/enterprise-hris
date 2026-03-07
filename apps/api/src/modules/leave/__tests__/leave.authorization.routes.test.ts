import express from 'express';
import request from 'supertest';
import leaveRoutes from '../leave.routes';
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

jest.mock('../leave.controller', () => {
  const ok = (_req: any, res: any) => res.status(200).json({ success: true });
  return {
    leaveController: {
      createLeaveType: jest.fn(ok),
      getLeaveTypes: jest.fn(ok),
      initializeBalances: jest.fn(ok),
      getMyBalances: jest.fn(ok),
      getBalances: jest.fn(ok),
      createLeaveRequest: jest.fn(ok),
      getMyLeaveRequests: jest.fn(ok),
      cancelRequest: jest.fn(ok),
      getLeaveRequests: jest.fn(ok),
      approveRequest: jest.fn(ok),
      rejectRequest: jest.fn(ok),
    },
  };
});

describe('Leave authorization routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/leave', leaveRoutes);
  app.use(errorHandler);

  it('blocks non-HR_ADMIN from POST /types (403)', async () => {
    const res = await request(app)
      .post('/api/leave/types')
      .set('x-roles', 'EMPLOYEE')
      .send({ name: 'Annual', code: 'ANNUAL', daysPerYear: 21 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('HR Admin access required');
  });

  it('blocks EMPLOYEE from approve endpoint (403)', async () => {
    const res = await request(app)
      .post('/api/leave/requests/request-1/approve')
      .set('x-roles', 'EMPLOYEE')
      .send();

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe(
      'Required role: MANAGER or HR_OFFICER or HR_ADMIN or GM or SUPER_ADMIN'
    );
  });

  it('allows MANAGER on GET /requests (200)', async () => {
    const res = await request(app)
      .get('/api/leave/requests')
      .set('x-roles', 'MANAGER');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
