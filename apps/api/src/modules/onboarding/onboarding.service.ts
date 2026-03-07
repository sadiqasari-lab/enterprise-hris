import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

interface OnboardingTaskInput {
  title: string;
  titleAr?: string;
  description?: string;
  order?: number;
}

const DEFAULT_TASKS: OnboardingTaskInput[] = [
  { title: 'Submit personal documents', description: 'Upload IQAMA/Passport and required documents', order: 1 },
  { title: 'Sign employment contract', description: 'Review and sign your employment contract', order: 2 },
  { title: 'Complete policy acknowledgment', description: 'Read and acknowledge company policies', order: 3 },
  { title: 'Attend orientation session', description: 'Join onboarding orientation with HR', order: 4 },
];

export class OnboardingService {
  async listChecklists(companyId: string, status?: string, employeeId?: string): Promise<any[]> {
    return prisma.onboardingChecklist.findMany({
      where: {
        status: status || undefined,
        employee_id: employeeId || undefined,
        employee: {
          company_id: companyId,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async createChecklist(employeeId: string, tasks?: OnboardingTaskInput[]): Promise<any> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const existing = await prisma.onboardingChecklist.findUnique({
      where: { employee_id: employeeId },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, 'Onboarding checklist already exists for this employee');
    }

    const normalizedTasks = (tasks && tasks.length > 0 ? tasks : DEFAULT_TASKS).map((task, index) => ({
      title: task.title,
      title_ar: task.titleAr || null,
      description: task.description || null,
      order: task.order || index + 1,
    }));

    return prisma.onboardingChecklist.create({
      data: {
        employee_id: employeeId,
        status: 'IN_PROGRESS',
        tasks: {
          create: normalizedTasks,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async getEmployeeChecklist(employeeId: string): Promise<any> {
    const checklist = await prisma.onboardingChecklist.findUnique({
      where: { employee_id: employeeId },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (checklist) {
      return checklist;
    }

    return this.createChecklist(employeeId, DEFAULT_TASKS);
  }

  async updateTask(
    employeeId: string,
    taskId: string,
    isCompleted: boolean,
    completedBy: string
  ): Promise<any> {
    const checklist = await prisma.onboardingChecklist.findUnique({
      where: { employee_id: employeeId },
      include: { tasks: true },
    });

    if (!checklist) {
      throw new ApiError(404, 'Onboarding checklist not found');
    }

    const existingTask = checklist.tasks.find((task) => task.id === taskId);
    if (!existingTask) {
      throw new ApiError(404, 'Onboarding task not found');
    }

    await prisma.onboardingTask.update({
      where: { id: taskId },
      data: {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : null,
        completed_by: isCompleted ? completedBy : null,
      },
    });

    const updatedTasks = await prisma.onboardingTask.findMany({
      where: { checklist_id: checklist.id },
      orderBy: { order: 'asc' },
    });

    const allCompleted = updatedTasks.every((task) => task.is_completed);

    await prisma.onboardingChecklist.update({
      where: { id: checklist.id },
      data: {
        status: allCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completed_at: allCompleted ? new Date() : null,
      },
    });

    return this.getEmployeeChecklist(employeeId);
  }

  async canAccessEmployeeChecklist(requestingUserId: string, employeeId: string, roles: string[]): Promise<boolean> {
    const elevatedRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_OFFICER', 'GM', 'MANAGER'];
    if (roles.some((role) => elevatedRoles.includes(role))) {
      return true;
    }

    const user = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { employee_id: true },
    });

    return user?.employee_id === employeeId;
  }
}

export const onboardingService = new OnboardingService();
