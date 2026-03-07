/**
 * Database Package
 * Exports Prisma Client for use across the application
 */

export * from './generated/client';
export { PrismaClient } from './generated/client';

// Re-export commonly used types
export type {
  User,
  Employee,
  Company,
  Department,
  Role,
  Permission,
  Document,
  AttendanceRecord,
  LeaveRequest,
  PayrollCycle,
  AuditLog,
} from './generated/client';
