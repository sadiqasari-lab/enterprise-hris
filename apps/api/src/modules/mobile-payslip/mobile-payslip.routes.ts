import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { mobilePayslipController } from './mobile-payslip.controller';

const router = Router();

router.get('/', authenticate, mobilePayslipController.getPayslips.bind(mobilePayslipController));
router.get('/:cycleId', authenticate, mobilePayslipController.getPayslipDetail.bind(mobilePayslipController));

export default router;
