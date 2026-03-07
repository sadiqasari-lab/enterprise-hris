import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
const prisma = new PrismaClient();

export class EmployeeService {
  // ── Departments ──────────────────────────────────────
  async createDepartment(companyId: string, data: { name: string; nameAr?: string; code: string; parentId?: string }): Promise<any> {
    const dup = await prisma.department.findFirst({ where: { company_id: companyId, code: data.code } });
    if (dup) throw new ApiError(409, `Department code '${data.code}' already exists`);
    return prisma.department.create({
      data: { company_id: companyId, name: data.name, name_ar: data.nameAr ?? null, code: data.code, parent_id: data.parentId ?? null },
    });
  }

  async getDepartments(companyId: string): Promise<any[]> {
    return prisma.department.findMany({
      where: { company_id: companyId, deleted_at: null },
      include: { parent: true, children: true, employees: { select: { id: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ── Employees ────────────────────────────────────────
  async createEmployee(companyId: string, data: {
    employeeNumber: string; firstName: string; firstNameAr?: string;
    lastName: string; lastNameAr?: string; email: string; phone?: string;
    hireDate: Date; departmentId: string; managerId?: string;
    position: string; positionAr?: string;
  }): Promise<any> {
    const dup = await prisma.employee.findFirst({ where: { employee_number: data.employeeNumber } });
    if (dup) throw new ApiError(409, `Employee number '${data.employeeNumber}' already exists`);

    return prisma.employee.create({
      data: {
        company_id: companyId,
        employee_number: data.employeeNumber,
        first_name: data.firstName,
        first_name_ar: data.firstNameAr ?? null,
        last_name: data.lastName,
        last_name_ar: data.lastNameAr ?? null,
        email: data.email,
        phone: data.phone ?? null,
        hire_date: data.hireDate,
        department_id: data.departmentId,
        manager_id: data.managerId ?? null,
        position: data.position,
        position_ar: data.positionAr ?? null,
        status: 'ACTIVE',
      },
      include: { department: true, manager: true },
    });
  }

  async getEmployees(companyId: string, filters: {
    search?: string; departmentId?: string; status?: string;
    page?: number; limit?: number;
  }): Promise<{ employees: any[]; total: number }> {
    const { page = 1, limit = 20, search, departmentId, status } = filters;
    const where: any = { company_id: companyId, deleted_at: null };
    if (departmentId) where.department_id = departmentId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employee_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { department: true, manager: { select: { first_name: true, last_name: true } }, salary_structure: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);
    return { employees, total };
  }

  async getEmployeeById(id: string): Promise<any> {
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: { select: { first_name: true, last_name: true } },
        salary_structure: true,
        documents: { select: { id: true, title: true, category: true, status: true } },
        leave_balances: { include: { leave_type: true } },
        performance_goals: true,
        training_records: true,
        certifications: true,
      },
    });
    if (!emp) throw new ApiError(404, 'Employee not found');
    return emp;
  }

  async updateEmployee(id: string, data: Partial<{
    firstName: string; firstNameAr: string; lastName: string; lastNameAr: string;
    email: string; phone: string; departmentId: string; managerId: string;
    position: string; positionAr: string; status: string;
  }>): Promise<any> {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new ApiError(404, 'Employee not found');

    return prisma.employee.update({
      where: { id },
      data: {
        ...(data.firstName && { first_name: data.firstName }),
        ...(data.firstNameAr !== undefined && { first_name_ar: data.firstNameAr }),
        ...(data.lastName && { last_name: data.lastName }),
        ...(data.lastNameAr !== undefined && { last_name_ar: data.lastNameAr }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.departmentId && { department_id: data.departmentId }),
        ...(data.managerId !== undefined && { manager_id: data.managerId }),
        ...(data.position && { position: data.position }),
        ...(data.positionAr !== undefined && { position_ar: data.positionAr }),
        ...(data.status && { status: data.status }),
      },
      include: { department: true, manager: { select: { first_name: true, last_name: true } } },
    });
  }

  async softDeleteEmployee(id: string): Promise<any> {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new ApiError(404, 'Employee not found');
    if (emp.status === 'TERMINATED') throw new ApiError(400, 'Employee already terminated');
    return prisma.employee.update({ where: { id }, data: { deleted_at: new Date(), status: 'TERMINATED' } });
  }

  async getDirectReports(managerId: string): Promise<any[]> {
    return prisma.employee.findMany({
      where: { manager_id: managerId, deleted_at: null },
      include: { department: true },
      orderBy: { first_name: 'asc' },
    });
  }

  // ── Salary Structure ─────────────────────────────────
  async createSalaryStructure(employeeId: string, data: {
    basicSalary: number; housingAllowance?: number; transportAllowance?: number;
    otherAllowances?: Record<string, number>; effectiveFrom: Date; effectiveTo?: Date;
  }): Promise<any> {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new ApiError(404, 'Employee not found');

    // Upsert: deactivate current if exists
    const existing = await prisma.salaryStructure.findUnique({ where: { employee_id: employeeId } });
    if (existing) {
      await prisma.salaryStructure.update({ where: { employee_id: employeeId }, data: { effective_to: data.effectiveFrom } });
    }

    return prisma.salaryStructure.create({
      data: {
        employee_id: employeeId,
        basic_salary: data.basicSalary,
        housing_allowance: data.housingAllowance ?? 0,
        transport_allowance: data.transportAllowance ?? 0,
        other_allowances: data.otherAllowances ?? null,
        effective_from: data.effectiveFrom,
        effective_to: data.effectiveTo ?? null,
      },
    });
  }

  async getSalaryStructure(employeeId: string): Promise<any> {
    const salary = await prisma.salaryStructure.findUnique({ where: { employee_id: employeeId } });
    if (!salary) throw new ApiError(404, 'Salary structure not found');
    return salary;
  }

  // ── Department Stats ─────────────────────────────────
  async getDepartmentStats(companyId: string): Promise<any[]> {
    const departments = await prisma.department.findMany({
      where: { company_id: companyId, deleted_at: null },
      include: { employees: { where: { deleted_at: null } } },
    });
    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      name_ar: d.name_ar,
      employeeCount: d.employees.length,
    }));
  }
}

export const employeeService = new EmployeeService();
