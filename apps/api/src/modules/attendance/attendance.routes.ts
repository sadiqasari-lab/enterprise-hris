/**
 * Attendance Routes
 * Routes for attendance check-in/check-out with anti-spoofing
 */

import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireHRAdmin } from '../../middleware/rbac.middleware';

const router = Router();

/**
 * Employee routes (authenticated employees)
 */
router.post(
  '/check-in',
  authenticate,
  attendanceController.checkIn.bind(attendanceController)
);
router.post(
  '/clock-in',
  authenticate,
  attendanceController.clockIn.bind(attendanceController)
);

router.post(
  '/check-out',
  authenticate,
  attendanceController.checkOut.bind(attendanceController)
);
router.post(
  '/clock-out',
  authenticate,
  attendanceController.clockOut.bind(attendanceController)
);

router.get(
  '/records',
  authenticate,
  attendanceController.getRecords.bind(attendanceController)
);

router.get(
  '/summary',
  authenticate,
  attendanceController.getSummary.bind(attendanceController)
);
router.get(
  '/monthly',
  authenticate,
  attendanceController.getMonthly.bind(attendanceController)
);

router.post(
  '/:id/request-correction',
  authenticate,
  attendanceController.requestCorrection.bind(attendanceController)
);

/**
 * HR Admin routes (flagged records management)
 */
router.get(
  '/flagged',
  authenticate,
  requireHRAdmin,
  attendanceController.getFlaggedRecords.bind(attendanceController)
);

router.put(
  '/:id/approve',
  authenticate,
  requireHRAdmin,
  attendanceController.approveFlagged.bind(attendanceController)
);

router.put(
  '/:id/reject',
  authenticate,
  requireHRAdmin,
  attendanceController.rejectFlagged.bind(attendanceController)
);

export default router;
