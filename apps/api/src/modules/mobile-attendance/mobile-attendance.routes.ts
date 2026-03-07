import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { mobileAttendanceController } from './mobile-attendance.controller';

const router = Router();

router.post('/check-in', authenticate, mobileAttendanceController.checkIn.bind(mobileAttendanceController));
router.post('/check-out', authenticate, mobileAttendanceController.checkOut.bind(mobileAttendanceController));
router.get('/status', authenticate, mobileAttendanceController.getStatus.bind(mobileAttendanceController));
router.get('/history', authenticate, mobileAttendanceController.getHistory.bind(mobileAttendanceController));

export default router;
