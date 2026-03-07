/**
 * RBAC Middleware
 * Role-Based Access Control for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { RBACService, UserPermissions } from '@hris/auth';
import { forbidden, unauthorized } from './errorHandler';

const rbacService = new RBACService();

/**
 * Check if user has required permission
 */
export const requirePermission = (
  resource: string,
  action: string,
  scope?: 'own' | 'department' | 'company' | 'all'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw unauthorized('Authentication required');
    }

    const userPermissions: UserPermissions = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      roles: req.user.roles,
      permissions: req.user.permissions.map((p) => {
        const [resource, action, scope] = p.split(':');
        return {
          resource,
          action,
          scope: scope as 'own' | 'department' | 'company' | 'all',
        };
      }),
    };

    const hasPermission = rbacService.hasPermission(
      userPermissions,
      resource,
      action,
      scope
    );

    if (!hasPermission) {
      throw forbidden(`You don't have permission to ${action} ${resource}`);
    }

    next();
  };
};

/**
 * Check if user has any of the specified roles
 */
export const requireAnyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw unauthorized('Authentication required');
    }

    const userPermissions: UserPermissions = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      roles: req.user.roles,
      permissions: [],
    };

    const hasRole = rbacService.hasAnyRole(userPermissions, roles);

    if (!hasRole) {
      throw forbidden(`Required role: ${roles.join(' or ')}`);
    }

    next();
  };
};

/**
 * Check if user has all of the specified roles
 */
export const requireAllRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw unauthorized('Authentication required');
    }

    const userPermissions: UserPermissions = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      roles: req.user.roles,
      permissions: [],
    };

    const hasAllRoles = rbacService.hasAllRoles(userPermissions, roles);

    if (!hasAllRoles) {
      throw forbidden(`Required roles: ${roles.join(' and ')}`);
    }

    next();
  };
};

/**
 * Super Admin only
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw unauthorized('Authentication required');
  }

  if (!req.user.roles.includes('SUPER_ADMIN')) {
    throw forbidden('Super Admin access required');
  }

  next();
};

/**
 * HR Admin or higher
 */
export const requireHRAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw unauthorized('Authentication required');
  }

  const allowedRoles = ['SUPER_ADMIN', 'HR_ADMIN'];
  const hasAccess = req.user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    throw forbidden('HR Admin access required');
  }

  next();
};

/**
 * GM only (for payroll approval)
 */
export const requireGM = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw unauthorized('Authentication required');
  }

  if (!req.user.roles.includes('GM')) {
    throw forbidden('General Manager access required');
  }

  next();
};

/**
 * Manager or higher
 */
export const requireManager = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw unauthorized('Authentication required');
  }

  const allowedRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_OFFICER', 'GM', 'MANAGER'];
  const hasAccess = req.user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    throw forbidden('Manager access required');
  }

  next();
};
