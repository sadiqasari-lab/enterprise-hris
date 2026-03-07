/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user data to request
 */

import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '@hris/auth';
import { unauthorized } from '../../middleware/errorHandler';
import { config } from '../../config';

const jwtService = new JWTService(
  config.jwt.accessTokenSecret,
  config.jwt.refreshTokenSecret
);

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
      companyId?: string;
    }
  }
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorized('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);

    // Attach user data to request
    req.user = decoded;
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;

    next();
  } catch (error: any) {
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwtService.verifyAccessToken(token);
      
      req.user = decoded;
      req.userId = decoded.userId;
      req.companyId = decoded.companyId;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
