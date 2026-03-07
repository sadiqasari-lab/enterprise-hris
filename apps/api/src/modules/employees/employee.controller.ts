import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';
import { ApiError } from '../../middleware/errorHandler';

export class EmployeeController {
  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await employeeService.createDepartment(req.companyId!, req.body);
      res.status(201).json({ success: true, data: { department: dept }, message: 'Department created' });
    } catch (e) { next(e); }
  }
  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const depts = await employeeService.getDepartments(req.companyId!);
      res.json({ success: true, data: { departments: depts } });
    } catch (e) { next(e); }
  }

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeNumber, firstName, firstNameAr, lastName, lastNameAr, email, phone, hireDate, departmentId, managerId, position, positionAr } = req.body;
      if (!employeeNumber || !firstName || !lastName || !email || !hireDate || !departmentId || !position)
        throw new ApiError(400, 'employeeNumber, firstName, lastName, email, hireDate, departmentId, position are required');
      const emp = await employeeService.createEmployee(req.companyId!, { employeeNumber, firstName, firstNameAr, lastName, lastNameAr, email, phone, hireDate: new Date(hireDate), departmentId, managerId, position, positionAr });
      res.status(201).json({ success: true, data: { employee: emp }, message: 'Employee created' });
    } catch (e) { next(e); }
  }
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const { employees, total } = await employeeService.getEmployees(req.companyId!, {
        search: req.query.search as string,
        departmentId: req.query.departmentId as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      });
      res.json({ success: true, data: { employees, total } });
    } catch (e) { next(e); }
  }
  async getEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const emp = await employeeService.getEmployeeById(req.params.id);
      res.json({ success: true, data: { employee: emp } });
    } catch (e) { next(e); }
  }
  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const emp = await employeeService.updateEmployee(req.params.id, req.body);
      res.json({ success: true, data: { employee: emp }, message: 'Employee updated' });
    } catch (e) { next(e); }
  }
  async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      await employeeService.softDeleteEmployee(req.params.id);
      res.json({ success: true, message: 'Employee archived' });
    } catch (e) { next(e); }
  }
  async getDirectReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await employeeService.getDirectReports(req.params.managerId);
      res.json({ success: true, data: { reports } });
    } catch (e) { next(e); }
  }
  async createSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const { basicSalary, housingAllowance, transportAllowance, otherAllowances, effectiveFrom, effectiveTo } = req.body;
      if (!basicSalary || !effectiveFrom) throw new ApiError(400, 'basicSalary and effectiveFrom required');
      const salary = await employeeService.createSalaryStructure(req.params.employeeId, { basicSalary, housingAllowance, transportAllowance, otherAllowances, effectiveFrom: new Date(effectiveFrom), effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined });
      res.status(201).json({ success: true, data: { salaryStructure: salary }, message: 'Salary structure created' });
    } catch (e) { next(e); }
  }
  async getSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const salary = await employeeService.getSalaryStructure(req.params.employeeId);
      res.json({ success: true, data: { salaryStructure: salary } });
    } catch (e) { next(e); }
  }
  async getDepartmentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await employeeService.getDepartmentStats(req.companyId!);
      res.json({ success: true, data: { departmentStats: stats } });
    } catch (e) { next(e); }
  }
}

export const employeeController = new EmployeeController();
