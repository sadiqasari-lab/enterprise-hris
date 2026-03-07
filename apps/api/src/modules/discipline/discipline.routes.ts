import { Router } from 'express';
import { disciplineController as dc } from './discipline.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole } from '../../middleware/rbac.middleware';
const router = Router();
const b = (fn: any) => fn.bind(dc);
const hrUp = requireAnyRole(['HR_OFFICER','HR_ADMIN','SUPER_ADMIN']);

router.post('/incidents', authenticate, hrUp, b(dc.createIncident));
router.get('/incidents', authenticate, hrUp, b(dc.getIncidents));
router.get('/incidents/:id', authenticate, hrUp, b(dc.getIncident));
router.post('/incidents/:id/actions', authenticate, hrUp, b(dc.addAction));
router.post('/incidents/:id/resolve', authenticate, hrUp, b(dc.resolveIncident));
export default router;
