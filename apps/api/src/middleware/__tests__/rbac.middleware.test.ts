import {
  requireAnyRole,
  requireHRAdmin,
  requireGM,
} from '../rbac.middleware';

describe('rbac middleware', () => {
  it('throws 401 when req.user is missing', () => {
    const middleware = requireAnyRole(['HR_ADMIN']);
    const req: any = {};
    const res: any = {};
    const next = jest.fn();

    expect(() => middleware(req, res, next)).toThrow(
      expect.objectContaining({ statusCode: 401 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('requireHRAdmin denies EMPLOYEE', () => {
    const req: any = {
      user: {
        userId: 'user-1',
        companyId: 'company-1',
        roles: ['EMPLOYEE'],
        permissions: [],
      },
    };
    const res: any = {};
    const next = jest.fn();

    expect(() => requireHRAdmin(req, res, next)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('requireGM denies non-GM role', () => {
    const req: any = {
      user: {
        userId: 'user-1',
        companyId: 'company-1',
        roles: ['HR_ADMIN'],
        permissions: [],
      },
    };
    const res: any = {};
    const next = jest.fn();

    expect(() => requireGM(req, res, next)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('requireAnyRole allows when one role matches', () => {
    const middleware = requireAnyRole(['MANAGER', 'HR_ADMIN']);
    const req: any = {
      user: {
        userId: 'user-1',
        companyId: 'company-1',
        roles: ['MANAGER'],
        permissions: [],
      },
    };
    const res: any = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
