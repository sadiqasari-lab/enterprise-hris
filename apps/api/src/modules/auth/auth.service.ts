/**
 * Authentication Service
 * Handles user authentication, login, logout, token refresh
 */

import { PrismaClient } from '@hris/database';
import crypto from 'crypto';
import { JWTService, PasswordService, JWTPayload, TokenPair } from '@hris/auth';
import { ApiError, unauthorized } from '../../middleware/errorHandler';
import { config } from '../../config';
import { sendPasswordResetEmail } from '../../utils/email';

const prisma = new PrismaClient();
const jwtService = new JWTService(
  config.jwt.accessTokenSecret,
  config.jwt.refreshTokenSecret,
  config.jwt.accessTokenExpiry as any,
  config.jwt.refreshTokenExpiry as any
);
const passwordService = new PasswordService();

export class AuthService {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{
    user: any;
    tokens: TokenPair;
  }> {
    // Find user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        employee: true,
        user_roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw unauthorized('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await passwordService.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw unauthorized('Invalid email or password');
    }

    // Extract roles and permissions
    const roles = user.user_roles.map((ur) => ur.role.name);
    const permissions = user.user_roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
      }))
    );

    // Generate JWT payload
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.company_id,
      roles,
      permissions: permissions.map(
        (p) => `${p.resource}:${p.action}:${p.scope}`
      ),
    };

    // Generate tokens
    const tokens = jwtService.generateTokenPair(jwtPayload);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        roles,
        permissions,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Get user with fresh data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          user_roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || !user.is_active) {
        throw unauthorized('User not found or inactive');
      }

      // Extract roles and permissions
      const roles = user.user_roles.map((ur) => ur.role.name);
      const permissions = user.user_roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => ({
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.permission.scope,
        }))
      );

      // Generate new token pair
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        companyId: user.company_id,
        roles,
        permissions: permissions.map(
          (p) => `${p.resource}:${p.action}:${p.scope}`
        ),
      };

      return jwtService.generateTokenPair(jwtPayload);
    } catch (error) {
      throw unauthorized('Invalid refresh token');
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(): Promise<{ message: string }> {
    // In a stateless JWT system, logout is typically handled client-side
    // Optionally, implement token blacklisting here
    return { message: 'Logged out successfully' };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await passwordService.compare(
      currentPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw unauthorized('Current password is incorrect');
    }

    // Validate new password strength
    const validation = passwordService.validateStrength(newPassword);
    if (!validation.isValid) {
      throw new ApiError(400, validation.errors.join(', '));
    }

    // Hash new password
    const newPasswordHash = await passwordService.hash(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Request password reset (send email with token)
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    if (!user.is_active) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { user_id: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const appUrl = process.env.WEB_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    // Validate new password strength
    const validation = passwordService.validateStrength(newPassword);
    if (!validation.isValid) {
      throw new ApiError(400, validation.errors.join(', '));
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord || !tokenRecord.user?.is_active) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const newPasswordHash = await passwordService.hash(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.user_id },
        data: { password_hash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used_at: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        employee: {
          include: {
            department: true,
            manager: true,
          },
        },
        user_roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const { password_hash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}

export const authService = new AuthService();
