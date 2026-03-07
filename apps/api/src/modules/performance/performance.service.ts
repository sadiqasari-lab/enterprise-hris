/**
 * Performance Management Service
 * Cycles → Goals → Appraisals (manager reviews employee).
 * Rating 1-5, feedback, strengths / areas-for-improvement.
 */

import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class PerformanceService {
  // ── Cycles ───────────────────────────────────────────
  async createCycle(companyId: string, data: { name: string; nameAr?: string; startDate: Date; endDate: Date }): Promise<any> {
    if (data.startDate >= data.endDate) throw new ApiError(400, 'startDate must be before endDate');
    return prisma.performanceCycle.create({
      data: {
        company_id: companyId,
        name: data.name,
        name_ar: data.nameAr ?? null,
        start_date: data.startDate,
        end_date: data.endDate,
        status: 'ACTIVE',
      },
    });
  }

  async getCycles(companyId: string, status?: string): Promise<any[]> {
    return prisma.performanceCycle.findMany({
      where: { company_id: companyId, ...(status && { status }) },
      include: { appraisals: { select: { id: true } } },
      orderBy: { start_date: 'desc' },
    });
  }

  async getCycleById(id: string): Promise<any> {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id }, include: { appraisals: true } });
    if (!cycle) throw new ApiError(404, 'Performance cycle not found');
    return cycle;
  }

  async completeCycle(id: string): Promise<any> {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new ApiError(404, 'Performance cycle not found');
    if (cycle.status !== 'ACTIVE') throw new ApiError(400, 'Only ACTIVE cycles can be completed');
    return prisma.performanceCycle.update({ where: { id }, data: { status: 'COMPLETED' } });
  }

  // ── Goals ────────────────────────────────────────────
  async createGoal(employeeId: string, data: { title: string; titleAr?: string; description?: string; targetDate: Date }): Promise<any> {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new ApiError(404, 'Employee not found');

    return prisma.goal.create({
      data: {
        employee_id: employeeId,
        title: data.title,
        title_ar: data.titleAr ?? null,
        description: data.description ?? null,
        target_date: data.targetDate,
        status: 'IN_PROGRESS',
        progress: 0,
      },
    });
  }

  async getGoals(filters: { employeeId?: string; status?: string }): Promise<any[]> {
    return prisma.goal.findMany({
      where: {
        ...(filters.employeeId && { employee_id: filters.employeeId }),
        ...(filters.status && { status: filters.status }),
      },
      include: { employee: { select: { first_name: true, last_name: true } } },
      orderBy: { target_date: 'asc' },
    });
  }

  async updateGoalProgress(goalId: string, progress: number, status?: string): Promise<any> {
    if (progress < 0 || progress > 100) throw new ApiError(400, 'Progress must be 0-100');
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new ApiError(404, 'Goal not found');

    const finalStatus = status ?? (progress === 100 ? 'COMPLETED' : goal.status);
    return prisma.goal.update({
      where: { id: goalId },
      data: { progress, status: finalStatus },
    });
  }

  // ── Appraisals ───────────────────────────────────────
  async createAppraisal(cycleId: string, employeeId: string, reviewerId: string): Promise<any> {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new ApiError(404, 'Performance cycle not found');
    if (cycle.status !== 'ACTIVE') throw new ApiError(400, 'Cycle is not active');

    const existing = await prisma.appraisal.findFirst({ where: { cycle_id: cycleId, employee_id: employeeId } });
    if (existing) throw new ApiError(409, 'Appraisal already exists for this employee in this cycle');

    return prisma.appraisal.create({
      data: {
        cycle_id: cycleId,
        employee_id: employeeId,
        reviewer_id: reviewerId,
        rating: 0,
        feedback: '',
        status: 'DRAFT',
      },
      include: { employee: true, cycle: true },
    });
  }

  async getAppraisals(filters: { cycleId?: string; employeeId?: string; reviewerId?: string; status?: string }): Promise<any[]> {
    return prisma.appraisal.findMany({
      where: {
        ...(filters.cycleId && { cycle_id: filters.cycleId }),
        ...(filters.employeeId && { employee_id: filters.employeeId }),
        ...(filters.reviewerId && { reviewer_id: filters.reviewerId }),
        ...(filters.status && { status: filters.status }),
      },
      include: { employee: true, cycle: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async submitAppraisal(appraisalId: string, data: {
    rating: number;
    feedback: string;
    strengths?: string;
    areasForImprovement?: string;
  }): Promise<any> {
    if (data.rating < 1 || data.rating > 5) throw new ApiError(400, 'Rating must be 1-5');
    if (!data.feedback.trim()) throw new ApiError(400, 'Feedback is required');

    const appraisal = await prisma.appraisal.findUnique({ where: { id: appraisalId } });
    if (!appraisal) throw new ApiError(404, 'Appraisal not found');
    if (appraisal.status !== 'DRAFT') throw new ApiError(400, 'Only DRAFT appraisals can be submitted');

    return prisma.appraisal.update({
      where: { id: appraisalId },
      data: {
        rating: data.rating,
        feedback: data.feedback,
        strengths: data.strengths ?? null,
        areas_for_improvement: data.areasForImprovement ?? null,
        status: 'SUBMITTED',
        submitted_at: new Date(),
      },
      include: { employee: true, cycle: true },
    });
  }

  async acknowledgeAppraisal(appraisalId: string): Promise<any> {
    const appraisal = await prisma.appraisal.findUnique({ where: { id: appraisalId } });
    if (!appraisal) throw new ApiError(404, 'Appraisal not found');
    if (appraisal.status !== 'SUBMITTED') throw new ApiError(400, 'Only SUBMITTED appraisals can be acknowledged');

    return prisma.appraisal.update({
      where: { id: appraisalId },
      data: { status: 'ACKNOWLEDGED', acknowledged_at: new Date() },
    });
  }

  // ── Summary / Analytics ──────────────────────────────
  async getCycleStats(cycleId: string): Promise<any> {
    const appraisals = await prisma.appraisal.findMany({
      where: { cycle_id: cycleId, status: { in: ['SUBMITTED', 'ACKNOWLEDGED'] } },
      select: { rating: true, employee_id: true },
    });

    const total = appraisals.length;
    if (total === 0) return { total: 0, avgRating: 0, distribution: {} };

    const avgRating = appraisals.reduce((s, a) => s + a.rating, 0) / total;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    appraisals.forEach((a) => { distribution[a.rating] = (distribution[a.rating] || 0) + 1; });

    return { total, avgRating: Math.round(avgRating * 100) / 100, distribution };
  }
}

export const performanceService = new PerformanceService();
