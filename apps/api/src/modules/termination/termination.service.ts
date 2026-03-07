import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
const prisma = new PrismaClient();

export class TerminationService {
  async create(companyId: string, data: {
    employeeId: string; terminationType: string;
    noticeDate: Date; lastWorkingDay: Date; reason?: string;
  }): Promise<any> {
    const validTypes = ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'END_OF_CONTRACT'];
    if (!validTypes.includes(data.terminationType)) throw new ApiError(400, `terminationType must be: ${validTypes.join(', ')}`);

    const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!emp) throw new ApiError(404, 'Employee not found');
    if (emp.status === 'TERMINATED') throw new ApiError(409, 'Employee is already terminated');

    const existing = await prisma.termination.findUnique({ where: { employee_id: data.employeeId } });
    if (existing) throw new ApiError(409, 'A termination record already exists for this employee');

    const termination = await prisma.termination.create({
      data: {
        company_id: companyId,
        employee_id: data.employeeId,
        termination_type: data.terminationType,
        notice_date: data.noticeDate,
        last_working_day: data.lastWorkingDay,
        reason: data.reason ?? null,
        status: 'PENDING',
      },
      include: { employee: { select: { first_name: true, last_name: true, department_id: true } } },
    });

    // Create exit checklist automatically
    await prisma.exitChecklist.create({
      data: {
        termination_id: termination.id,
        items: [
          { id: 1, task: 'Return company laptop', completed: false },
          { id: 2, task: 'Return access cards & badges', completed: false },
          { id: 3, task: 'Complete knowledge transfer', completed: false },
          { id: 4, task: 'Final salary settlement', completed: false },
          { id: 5, task: 'Exit interview', completed: false },
          { id: 6, task: 'GOSI deregistration', completed: false },
        ],
      },
    });

    return termination;
  }

  async getAll(companyId: string, filters: { status?: string; type?: string }): Promise<any[]> {
    return prisma.termination.findMany({
      where: {
        company_id: companyId,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { termination_type: filters.type }),
      },
      include: { employee: { select: { first_name: true, last_name: true } }, checklist: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getById(id: string): Promise<any> {
    const t = await prisma.termination.findUnique({ where: { id }, include: { employee: true, checklist: true } });
    if (!t) throw new ApiError(404, 'Termination record not found');
    return t;
  }

  async approve(id: string, approvedBy: string): Promise<any> {
    const t = await prisma.termination.findUnique({ where: { id } });
    if (!t) throw new ApiError(404, 'Termination record not found');
    if (t.status !== 'PENDING') throw new ApiError(400, 'Only PENDING terminations can be approved');

    return prisma.termination.update({
      where: { id },
      data: { status: 'APPROVED', approved_by: approvedBy, approved_at: new Date() },
      include: { employee: true, checklist: true },
    });
  }

  async complete(id: string, settlementAmount?: number): Promise<any> {
    const t = await prisma.termination.findUnique({ where: { id } });
    if (!t) throw new ApiError(404, 'Termination record not found');
    if (t.status !== 'APPROVED') throw new ApiError(400, 'Only APPROVED terminations can be completed');

    // Mark employee as terminated
    await prisma.employee.update({ where: { id: t.employee_id }, data: { status: 'TERMINATED' } });

    return prisma.termination.update({
      where: { id },
      data: { status: 'COMPLETED', final_settlement_amount: settlementAmount ?? null },
      include: { employee: true, checklist: true },
    });
  }

  async updateChecklist(terminationId: string, items: any[]): Promise<any> {
    const checklist = await prisma.exitChecklist.findUnique({ where: { termination_id: terminationId } });
    if (!checklist) throw new ApiError(404, 'Exit checklist not found');

    const allDone = items.every((i: any) => i.completed);
    return prisma.exitChecklist.update({
      where: { termination_id: terminationId },
      data: { items, is_completed: allDone, completed_at: allDone ? new Date() : null },
    });
  }
}

export const terminationService = new TerminationService();
