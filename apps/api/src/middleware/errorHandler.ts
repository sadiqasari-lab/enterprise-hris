/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database Error';
  }

  // Log error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// Helper functions for common errors
export const notFound = (resource: string) => {
  return new ApiError(404, `${resource} not found`);
};

export const badRequest = (message: string) => {
  return new ApiError(400, message);
};

export const unauthorized = (message = 'Unauthorized') => {
  return new ApiError(401, message);
};

export const forbidden = (message = 'Forbidden') => {
  return new ApiError(403, message);
};

export const conflict = (message: string) => {
  return new ApiError(409, message);
};
