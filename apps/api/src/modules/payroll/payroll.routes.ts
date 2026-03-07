/**
 * Payroll Routes
 * Strict role-based access for payroll workflow
 * 
 * HR Officer: Create & submit
 * HR Admin: Review & execute (after GM approval)
 * GM: Final approval (CRITICAL)
 * Employees: View own payslips
 */

import { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authenticate } from '../auth/auth.middleware';
import {
  requireAnyRole,
  requireHRAdmin,
  requireGM,
} from '../../middleware/rbac.middleware';

const router = Router();

/**
 * HR Officer Routes (Prepare & Submit)
 */
router.post(
  '/cycles',
  authenticate,
  requireAnyRole(['HR_OFFICER', 'HR_ADMIN', 'SUPER_ADMIN']),
  payrollController.createCycle.bind(payrollController)
);

router.post(
  '/cycles/:id/records',
  authenticate,
  requireAnyRole(['HR_OFFICER', 'HR_ADMIN', 'SUPER_ADMIN']),
  payrollController.addRecords.bind(payrollController)
);

router.post(
  '/cycles/:id/submit',
  authenticate,
  requireAnyRole(['HR_OFFICER', 'HR_ADMIN', 'SUPER_ADMIN']),
  payrollController.submitForReview.bind(payrollController)
);

router.delete(
  '/cycles/:id',
  authenticate,
  requireAnyRole(['HR_OFFICER', 'HR_ADMIN', 'SUPER_ADMIN']),
  payrollController.deleteCycle.bind(payrollController)
);

/**
 * HR Admin Routes (Review)
 */
router.post(
  '/cycles/:id/review',
  authenticate,
  requireHRAdmin,
  payrollController.reviewPayroll.bind(payrollController)
);

/**
 * GM Route (FINAL APPROVAL - CRITICAL)
 * ONLY GM can access this endpoint
 */
router.post(
  '/cycles/:id/gm-approval',
  authenticate,
  requireGM,
  payrollController.gmApproval.bind(payrollController)
);

/**
 * HR Admin Routes (Execute - after GM approval)
 */
router.post(
  '/cycles/:id/execute',
  authenticate,
  requireHRAdmin,
  payrollController.executePayroll.bind(payrollController)
);

/**
 * View Routes (HR Admin and above)
 */
router.get(
  '/cycles',
  authenticate,
  requireHRAdmin,
  payrollController.getCycles.bind(payrollController)
);

router.get(
  '/cycles/:id',
  authenticate,
  requireHRAdmin,
  payrollController.getCycle.bind(payrollController)
);

router.get(
  '/payslips/:cycleId/:employeeId',
  authenticate,
  payrollController.getPayslip.bind(payrollController)
);

/**
 * Employee Self-Service Routes
 */
router.get(
  '/payslips/my',
  authenticate,
  payrollController.getMyPayslips.bind(payrollController)
);

export default router;
