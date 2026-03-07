import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@hris/database';

const prisma = new PrismaClient();

export class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { resourceType, action, userId, startDate, endDate, page, limit } = req.query;
      const pg = page ? parseInt(page as string, 10) : 1;
      const lim = limit ? parseInt(limit as string, 10) : 50;

      const where: any = { company_id: companyId };
      if (resourceType) where.resource_type = resourceType;
      if (action) where.action = action;
      if (userId) where.user_id = userId;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate as string);
        if (endDate) where.timestamp.lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { email: true } } },
          orderBy: { timestamp: 'desc' },
          skip: (pg - 1) * lim,
          take: lim,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ success: true, data: { logs, total, page: pg, limit: lim } });
    } catch (e) { next(e); }
  }
}

export const auditController = new AuditController();
