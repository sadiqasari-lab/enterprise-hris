import { PrismaClient } from '@hris/database';
const prisma = new PrismaClient();

export class AuditService {
  /** Write a new audit entry – called internally by other services */
  static async log(data: {
    userId: string; companyId: string; action: string;
    resourceType: string; resourceId: string;
    ipAddress: string; userAgent: string;
    changes?: any; metadata?: any;
  }) {
    return prisma.auditLog.create({ data: {
      user_id: data.userId, company_id: data.companyId,
      action: data.action, resource_type: data.resourceType,
      resource_id: data.resourceId,
      ip_address: data.ipAddress, user_agent: data.userAgent,
      changes: data.changes ?? null, metadata: data.metadata ?? null,
    }});
  }

  /** Query audit logs with filters */
  static async query(companyId: string, filters: {
    userId?: string; resourceType?: string; action?: string;
    startDate?: Date; endDate?: Date; page?: number; limit?: number;
  }) {
    const { page = 1, limit = 50 } = filters;
    const where: any = { company_id: companyId };
    if (filters.userId) where.user_id = filters.userId;
    if (filters.resourceType) where.resource_type = filters.resourceType;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { logs, total };
  }
}
