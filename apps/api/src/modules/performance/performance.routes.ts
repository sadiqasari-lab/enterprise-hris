import { Router } from 'express';
import { performanceController as pc } from './performance.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole, requireHRAdmin } from '../../middleware/rbac.middleware';

const router = Router();
const b = (fn: any) => fn.bind(pc);

// Cycles (HR Admin manages)
router.post('/cycles', authenticate, requireHRAdmin, b(pc.createCycle));
router.get('/cycles', authenticate, b(pc.getCycles));
router.get('/cycles/:id', authenticate, b(pc.getCycle));
router.post('/cycles/:id/complete', authenticate, requireHRAdmin, b(pc.completeCycle));
router.get('/cycles/:id/stats', authenticate, b(pc.getCycleStats));

// Goals
router.post('/employees/:employeeId/goals', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','SUPER_ADMIN']), b(pc.createGoal));
router.get('/goals', authenticate, b(pc.getGoals));
router.put('/goals/:id/progress', authenticate, b(pc.updateGoalProgress));

// Appraisals
router.post('/cycles/:cycleId/appraisals/:employeeId', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','SUPER_ADMIN']), b(pc.createAppraisal));
router.get('/appraisals', authenticate, b(pc.getAppraisals));
router.post('/appraisals/:id/submit', authenticate, requireAnyRole(['MANAGER','HR_OFFICER','HR_ADMIN','SUPER_ADMIN']), b(pc.submitAppraisal));
router.post('/appraisals/:id/acknowledge', authenticate, b(pc.acknowledgeAppraisal));

export default router;
