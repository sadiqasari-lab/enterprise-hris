/**
 * Payroll Workflow Validation Middleware
 * Additional security layer to enforce GM approval workflow
 * This prevents any potential bypass attempts
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@hris/database';
import { ApiError, forbidden } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Validate that payroll execution can only happen after GM approval
 */
export const validatePayrollExecution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const cycle = await prisma.payrollCycle.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        approved_by_gm: true,
        is_locked: true,
      },
    });

    if (!cycle) {
      throw new ApiError(404, 'Payroll cycle not found');
    }

    // CRITICAL CHECKS
    if (cycle.status !== 'APPROVED') {
      throw forbidden(
        `Payroll execution requires GM approval. Current status: ${cycle.status}`
      );
    }

    if (!cycle.approved_by_gm) {
      throw forbidden('GM approval record not found');
    }

    if (!cycle.is_locked) {
      throw forbidden('Payroll must be locked by GM approval before execution');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate that only GM can approve payroll
 */
export const validateGMApprovalAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    // Get user roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw forbidden('User not found');
    }

    // Check if user has GM role
    const isGM = user.user_roles.some((ur) => ur.role.name === 'GM');

    if (!isGM) {
      throw forbidden(
        'Access Denied: Only General Manager (GM) can approve payroll for execution'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate payroll cycle is in correct status for the action
 */
export const validatePayrollStatus = (allowedStatuses: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const cycle = await prisma.payrollCycle.findUnique({
        where: { id },
        select: {
          status: true,
        },
      });

      if (!cycle) {
        throw new ApiError(404, 'Payroll cycle not found');
      }

      if (!allowedStatuses.includes(cycle.status)) {
        throw new ApiError(
          400,
          `Invalid payroll status. Current: ${cycle.status}, Required: ${allowedStatuses.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Prevent modification of locked payroll
 */
export const preventLockedPayrollModification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const cycle = await prisma.payrollCycle.findUnique({
      where: { id },
      select: {
        is_locked: true,
        status: true,
      },
    });

    if (!cycle) {
      throw new ApiError(404, 'Payroll cycle not found');
    }

    if (cycle.is_locked) {
      throw forbidden(
        'Payroll is locked after GM approval and cannot be modified'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Log payroll actions for audit trail
 */
export const logPayrollAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Log the action
      // This would integrate with your audit logging service
      console.log(`[PAYROLL AUDIT] User ${userId} performed ${action} on payroll cycle ${id}`);

      next();
    } catch (error) {
      next(error);
    }
  };
};
