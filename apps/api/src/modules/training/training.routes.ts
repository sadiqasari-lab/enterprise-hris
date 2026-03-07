import { Router } from 'express';
import { trainingController as tc } from './training.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole } from '../../middleware/rbac.middleware';
const router = Router();
const b = (fn: any) => fn.bind(tc);
const hrUp = requireAnyRole(['HR_OFFICER','HR_ADMIN','SUPER_ADMIN']);

router.post('/employees/:employeeId/trainings', authenticate, hrUp, b(tc.createTraining));
router.get('/trainings', authenticate, b(tc.getTrainings));
router.patch('/trainings/:id/status', authenticate, hrUp, b(tc.updateStatus));
router.post('/employees/:employeeId/certifications', authenticate, hrUp, b(tc.addCertification));
router.get('/employees/:employeeId/certifications', authenticate, b(tc.getCertifications));
export default router;
