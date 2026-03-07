/**
 * JWT Utilities
 * Token generation and verification
 */

import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: jwt.SignOptions['expiresIn'];
  private refreshTokenExpiry: jwt.SignOptions['expiresIn'];

  constructor(
    accessTokenSecret: string,
    refreshTokenSecret: string,
    accessTokenExpiry: jwt.SignOptions['expiresIn'] = '15m',
    refreshTokenExpiry: jwt.SignOptions['expiresIn'] = '7d'
  ) {
    this.accessTokenSecret = accessTokenSecret;
    this.refreshTokenSecret = refreshTokenSecret;
    this.accessTokenExpiry = accessTokenExpiry;
    this.refreshTokenExpiry = refreshTokenExpiry;
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
