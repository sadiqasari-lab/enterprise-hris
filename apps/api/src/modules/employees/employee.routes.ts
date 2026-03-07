import { Router } from 'express';
import { employeeController as ec } from './employee.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole, requireHRAdmin } from '../../middleware/rbac.middleware';

const router = Router();
const b = (fn: any) => fn.bind(ec);
const hrUp = requireAnyRole(['HR_OFFICER','HR_ADMIN','SUPER_ADMIN']);

// Departments
router.post('/departments', authenticate, hrUp, b(ec.createDepartment));
router.get('/departments', authenticate, b(ec.getDepartments));

// Employees CRUD
router.post('/', authenticate, hrUp, b(ec.createEmployee));
router.get('/', authenticate, b(ec.getEmployees));
router.get('/stats/departments', authenticate, b(ec.getDepartmentStats));
router.get('/:id', authenticate, b(ec.getEmployee));
router.put('/:id', authenticate, hrUp, b(ec.updateEmployee));
router.delete('/:id', authenticate, requireHRAdmin, b(ec.deleteEmployee));

// Manager – direct reports
router.get('/:managerId/reports', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','GM','SUPER_ADMIN']), b(ec.getDirectReports));

// Salary structures
router.post('/:employeeId/salary', authenticate, hrUp, b(ec.createSalaryStructure));
router.get('/:employeeId/salary', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','GM','SUPER_ADMIN']), b(ec.getSalaryStructure));

export default router;
