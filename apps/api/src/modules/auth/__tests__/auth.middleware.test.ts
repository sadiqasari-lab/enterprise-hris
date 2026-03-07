import { Request, Response } from 'express';

const mockVerifyAccessToken = jest.fn();

jest.mock('@hris/auth', () => ({
  JWTService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: mockVerifyAccessToken,
  })),
}));

import { authenticate } from '../auth.middleware';

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createResponseMock() {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    return {
      status,
      json,
    };
  }

  it('returns 401 INVALID_TOKEN when bearer token is missing', () => {
    const req = {
      headers: {},
    } as unknown as Request;
    const resMock = createResponseMock();
    const res = resMock as unknown as Response;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(resMock.status).toHaveBeenCalledWith(401);
    expect(resMock.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 INVALID_TOKEN when token is invalid', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('bad token');
    });

    const req = {
      headers: { authorization: 'Bearer token-1' },
    } as unknown as Request;
    const resMock = createResponseMock();
    const res = resMock as unknown as Response;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('token-1');
    expect(resMock.status).toHaveBeenCalledWith(401);
    expect(resMock.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 TOKEN_EXPIRED when jwt is expired', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = {
      headers: { authorization: 'Bearer token-expired' },
    } as unknown as Request;
    const resMock = createResponseMock();
    const res = resMock as unknown as Response;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(resMock.status).toHaveBeenCalledWith(401);
    expect(resMock.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches decoded user fields and calls next for valid token', () => {
    mockVerifyAccessToken.mockReturnValue({
      userId: 'user-1',
      companyId: 'company-1',
      email: 'user@example.com',
      roles: ['EMPLOYEE'],
      permissions: ['attendance:read:own'],
    });

    const req: any = {
      headers: { authorization: 'Bearer token-valid' },
    };
    const resMock = createResponseMock();
    const res = resMock as unknown as Response;
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.userId).toBe('user-1');
    expect(req.companyId).toBe('company-1');
    expect(req.user).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        companyId: 'company-1',
      })
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(resMock.status).not.toHaveBeenCalled();
  });
});
