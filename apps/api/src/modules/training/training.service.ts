import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
const prisma = new PrismaClient();

export class TrainingService {
  async createTraining(employeeId: string, data: {
    title: string; titleAr?: string; provider?: string;
    startDate: Date; endDate: Date;
  }): Promise<any> {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new ApiError(404, 'Employee not found');
    if (data.startDate > data.endDate) throw new ApiError(400, 'startDate must be before endDate');

    return prisma.trainingRecord.create({
      data: {
        employee_id: employeeId,
        title: data.title,
        title_ar: data.titleAr ?? null,
        provider: data.provider ?? null,
        start_date: data.startDate,
        end_date: data.endDate,
        status: 'SCHEDULED',
      },
      include: { employee: { select: { first_name: true, last_name: true } } },
    });
  }

  async getTrainings(filters: { employeeId?: string; status?: string; page?: number; limit?: number }): Promise<{ trainings: any[]; total: number }> {
    const { page = 1, limit = 20 } = filters;
    const where: any = {};
    if (filters.employeeId) where.employee_id = filters.employeeId;
    if (filters.status) where.status = filters.status;

    const [trainings, total] = await Promise.all([
      prisma.trainingRecord.findMany({ where, include: { employee: { select: { first_name: true, last_name: true } } }, orderBy: { start_date: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.trainingRecord.count({ where }),
    ]);
    return { trainings, total };
  }

  async updateStatus(id: string, status: string): Promise<any> {
    const valid = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!valid.includes(status)) throw new ApiError(400, `Status must be one of: ${valid.join(', ')}`);
    const rec = await prisma.trainingRecord.findUnique({ where: { id } });
    if (!rec) throw new ApiError(404, 'Training record not found');
    return prisma.trainingRecord.update({ where: { id }, data: { status } });
  }

  async addCertification(employeeId: string, data: {
    name: string; nameAr?: string; issuingOrg: string;
    issueDate: Date; expiryDate?: Date; certificatePath?: string;
  }): Promise<any> {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new ApiError(404, 'Employee not found');
    return prisma.certification.create({
      data: {
        employee_id: employeeId,
        name: data.name,
        name_ar: data.nameAr ?? null,
        issuing_org: data.issuingOrg,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate ?? null,
        certificate_path: data.certificatePath ?? null,
        is_active: true,
      },
    });
  }

  async getCertifications(employeeId: string): Promise<any[]> {
    return prisma.certification.findMany({ where: { employee_id: employeeId }, orderBy: { issue_date: 'desc' } });
  }
}

export const trainingService = new TrainingService();
