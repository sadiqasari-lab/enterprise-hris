import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
const prisma = new PrismaClient();

export class CompanyService {
  async create(data: { name: string; nameAr?: string; code: string; settings?: any }): Promise<any> {
    const dup = await prisma.company.findFirst({ where: { code: data.code } });
    if (dup) throw new ApiError(409, `Company code '${data.code}' already exists`);
    return prisma.company.create({
      data: { name: data.name, name_ar: data.nameAr ?? null, code: data.code, settings: data.settings ?? null },
    });
  }

  async getAll(): Promise<any[]> {
    return prisma.company.findMany({ where: { deleted_at: null }, orderBy: { name: 'asc' } });
  }

  async getById(id: string): Promise<any> {
    const c = await prisma.company.findUnique({ where: { id } });
    if (!c) throw new ApiError(404, 'Company not found');
    return c;
  }

  async update(id: string, data: Partial<{ name: string; nameAr: string; settings: any }>): Promise<any> {
    const c = await prisma.company.findUnique({ where: { id } });
    if (!c) throw new ApiError(404, 'Company not found');
    return prisma.company.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameAr !== undefined && { name_ar: data.nameAr }),
        ...(data.settings !== undefined && { settings: data.settings }),
      },
    });
  }

  async getStats(id: string): Promise<any> {
    const [employees, departments, activeLeaves, pendingPayroll] = await Promise.all([
      prisma.employee.count({ where: { company_id: id, deleted_at: null } }),
      prisma.department.count({ where: { company_id: id, deleted_at: null } }),
      prisma.leaveRequest.count({ where: { employee: { company_id: id }, status: 'APPROVED', end_date: { gte: new Date() } } }),
      prisma.payrollCycle.count({ where: { company_id: id, status: { in: ['PENDING_REVIEW', 'PENDING_GM_APPROVAL'] } } }),
    ]);
    return { employees, departments, activeLeaves, pendingPayroll };
  }
}

export const companyService = new CompanyService();
