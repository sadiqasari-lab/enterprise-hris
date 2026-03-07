import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole } from '../../middleware/rbac.middleware';
const router = Router();

// Read-only – HR Admin / Super Admin only
router.get('/logs', authenticate, requireAnyRole(['HR_ADMIN','SUPER_ADMIN']), auditController.getLogs.bind(auditController));
export default router;
