import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

interface MobileProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
}

export class MobileProfileService {
  private async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        is_active: true,
        last_login: true,
        created_at: true,
        employee_id: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.employee_id) {
      throw new ApiError(404, 'Employee profile not linked to this user');
    }

    return user;
  }

  async getProfile(userId: string): Promise<any> {
    await this.getUser(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        is_active: true,
        last_login: true,
        created_at: true,
        employee: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            position: true,
            hire_date: true,
            status: true,
            date_of_birth: true,
            nationality: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!user?.employee) {
      throw new ApiError(404, 'Employee profile not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
      },
      employee: {
        id: user.employee.id,
        employeeNumber: user.employee.employee_number,
        firstName: user.employee.first_name,
        lastName: user.employee.last_name,
        fullName: `${user.employee.first_name} ${user.employee.last_name}`.trim(),
        workEmail: user.employee.email,
        phone: user.employee.phone,
        position: user.employee.position,
        hireDate: user.employee.hire_date,
        status: user.employee.status,
        dateOfBirth: user.employee.date_of_birth,
        nationality: user.employee.nationality,
        department: user.employee.department,
        manager: user.employee.manager
          ? {
              id: user.employee.manager.id,
              fullName: `${user.employee.manager.first_name} ${user.employee.manager.last_name}`.trim(),
            }
          : null,
      },
    };
  }

  async updateProfile(userId: string, payload: MobileProfileUpdateInput): Promise<any> {
    const user = await this.getUser(userId);

    const updateData: any = {};

    if (payload.firstName !== undefined) {
      const value = payload.firstName.trim();
      if (!value) {
        throw new ApiError(400, 'First name cannot be empty');
      }
      updateData.first_name = value;
    }

    if (payload.lastName !== undefined) {
      const value = payload.lastName.trim();
      if (!value) {
        throw new ApiError(400, 'Last name cannot be empty');
      }
      updateData.last_name = value;
    }

    if (payload.phone !== undefined) {
      updateData.phone = payload.phone.trim() || null;
    }

    if (payload.nationality !== undefined) {
      updateData.nationality = payload.nationality.trim() || null;
    }

    if (payload.dateOfBirth !== undefined) {
      if (!payload.dateOfBirth) {
        updateData.date_of_birth = null;
      } else {
        const parsed = new Date(payload.dateOfBirth);
        if (Number.isNaN(parsed.getTime())) {
          throw new ApiError(400, 'Invalid dateOfBirth');
        }
        updateData.date_of_birth = parsed;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No profile fields provided for update');
    }

    await prisma.employee.update({
      where: { id: user.employee_id! },
      data: updateData,
    });

    return this.getProfile(userId);
  }
}

export const mobileProfileService = new MobileProfileService();
