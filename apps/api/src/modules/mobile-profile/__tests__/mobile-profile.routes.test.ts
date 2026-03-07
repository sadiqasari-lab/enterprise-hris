import express from 'express';
import request from 'supertest';
import mobileProfileRoutes from '../mobile-profile.routes';
import { errorHandler, ApiError } from '../../../middleware/errorHandler';
import { mobileProfileService } from '../mobile-profile.service';

jest.mock('../../auth/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    req.companyId = 'company-1';
    next();
  },
}));

jest.mock('../mobile-profile.service', () => ({
  mobileProfileService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

describe('MobileProfileRoutes', () => {
  const mockGetProfile = mobileProfileService.getProfile as jest.Mock;
  const mockUpdateProfile = mobileProfileService.updateProfile as jest.Mock;
  const app = express();
  app.use(express.json());
  app.use('/api/mobile/profile', mobileProfileRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /me returns profile', async () => {
    mockGetProfile.mockResolvedValue({
      user: { id: 'user-1', email: 'employee@company.com' },
      employee: { id: 'emp-1', firstName: 'Aisha', lastName: 'Ali' },
    });

    const res = await request(app).get('/api/mobile/profile/me');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee.firstName).toBe('Aisha');
  });

  it('PUT /me updates profile', async () => {
    mockUpdateProfile.mockResolvedValue({
      user: { id: 'user-1', email: 'employee@company.com' },
      employee: { id: 'emp-1', firstName: 'Sara', lastName: 'Hassan' },
    });

    const res = await request(app)
      .put('/api/mobile/profile/me')
      .send({ firstName: 'Sara', lastName: 'Hassan' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profile updated successfully');
  });

  it('returns structured API error response', async () => {
    mockUpdateProfile.mockRejectedValue(new ApiError(400, 'Invalid dateOfBirth'));

    const res = await request(app)
      .put('/api/mobile/profile/me')
      .send({ dateOfBirth: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid dateOfBirth');
  });
});
