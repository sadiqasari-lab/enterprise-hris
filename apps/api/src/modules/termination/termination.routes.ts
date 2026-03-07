import { Router } from 'express';
import { terminationController as tc } from './termination.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole, requireHRAdmin } from '../../middleware/rbac.middleware';
const router = Router();
const b = (fn: any) => fn.bind(tc);
const hrUp = requireAnyRole(['HR_OFFICER','HR_ADMIN','SUPER_ADMIN']);

router.post('/', authenticate, hrUp, b(tc.create));
router.get('/', authenticate, hrUp, b(tc.getAll));
router.get('/:id', authenticate, hrUp, b(tc.getById));
router.post('/:id/approve', authenticate, requireHRAdmin, b(tc.approve));
router.post('/:id/complete', authenticate, requireHRAdmin, b(tc.complete));
router.put('/:id/checklist', authenticate, hrUp, b(tc.updateChecklist));
export default router;
