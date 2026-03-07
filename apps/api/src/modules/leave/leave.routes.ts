/**
 * Leave Routes
 * Employee: create / cancel / view own requests + balances
 * Manager / HR_OFFICER: approve / reject / view team requests
 * HR_ADMIN: full CRUD on leave types, initialise balances
 */

import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole, requireHRAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// ── Leave-type management (HR Admin) ───────────────────
router.post('/types', authenticate, requireHRAdmin, leaveController.createLeaveType.bind(leaveController));
router.get('/types', authenticate, leaveController.getLeaveTypes.bind(leaveController));

// ── Balance initialisation (HR Admin / onboarding) ─────
router.post('/balances/:employeeId/init', authenticate, requireHRAdmin, leaveController.initializeBalances.bind(leaveController));

// ── Balance reads ──────────────────────────────────────
router.get('/balances/my', authenticate, leaveController.getMyBalances.bind(leaveController));
router.get('/balances/:employeeId', authenticate, requireAnyRole(['HR_ADMIN','HR_OFFICER','MANAGER','GM','SUPER_ADMIN']), leaveController.getBalances.bind(leaveController));

// ── Employee self-service ──────────────────────────────
router.post('/requests', authenticate, leaveController.createLeaveRequest.bind(leaveController));
router.get('/requests/my', authenticate, leaveController.getMyLeaveRequests.bind(leaveController));
router.post('/requests/:id/cancel', authenticate, leaveController.cancelRequest.bind(leaveController));

// ── Manager / HR approval queue ────────────────────────
router.get('/requests', authenticate, requireAnyRole(['HR_ADMIN','HR_OFFICER','MANAGER','GM','SUPER_ADMIN']), leaveController.getLeaveRequests.bind(leaveController));
router.post('/requests/:id/approve', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','GM','SUPER_ADMIN']), leaveController.approveRequest.bind(leaveController));
router.post('/requests/:id/reject', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','GM','SUPER_ADMIN']), leaveController.rejectRequest.bind(leaveController));

export default router;
