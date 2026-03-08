import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { payslipController } from './payslip.controller';

const router = Router();

router.get('/', authenticate, payslipController.getMyPayslips.bind(payslipController));

export default router;
