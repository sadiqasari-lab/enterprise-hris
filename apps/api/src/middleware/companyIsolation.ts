/**
 * Company Isolation Middleware
 * Ensures multi-company data separation
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@hris/database';
import { forbidden, unauthorized } from './errorHandler';

const prisma = new PrismaClient();

/**
 * Ensure user can only access their own company's data
 * Automatically filters queries by company_id
 */
export const companyIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw unauthorized('Authentication required');
  }

  // Super Admin can access all companies
  if (req.user.roles.includes('SUPER_ADMIN')) {
    return next();
  }

  // For all other users, enforce company isolation
  // The companyId from JWT is already attached to req.companyId
  // Controllers should use this to filter data

  next();
};

/**
 * Validate that a resource belongs to user's company
 */
export const validateCompanyOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw unauthorized('Authentication required');
    }

    // Super Admin bypass
    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const resourceId = req.params.id;

    if (!resourceId) {
      return next();
    }

    try {
      // Check if resource belongs to user's company
      let resource: any;

      switch (resourceType) {
        case 'employee':
          resource = await prisma.employee.findUnique({
            where: { id: resourceId },
            select: { company_id: true },
          });
          break;
        case 'document':
          resource = await prisma.document.findUnique({
            where: { id: resourceId },
            select: { company_id: true },
          });
          break;
        case 'attendance':
          resource = await prisma.attendanceRecord.findUnique({
            where: { id: resourceId },
            select: { company_id: true },
          });
          break;
        case 'payroll':
          resource = await prisma.payrollCycle.findUnique({
            where: { id: resourceId },
            select: { company_id: true },
          });
          break;
        // Add more resource types as needed
        default:
          return next();
      }

      if (!resource) {
        throw forbidden('Resource not found');
      }

      if (resource.company_id !== req.companyId) {
        throw forbidden('Access denied: Resource belongs to another company');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Add company_id filter to Prisma queries
 * This is a helper function to be used in services
 */
export const addCompanyFilter = (
  baseWhere: any,
  companyId: string,
  isSuperAdmin: boolean
) => {
  if (isSuperAdmin) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    company_id: companyId,
  };
};
