import { Router } from 'express';
import { companyController as cc } from './company.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';
const router = Router();
const b = (fn: any) => fn.bind(cc);

// Super Admin only for mutation; reads available to any authenticated user
router.post('/', authenticate, requireSuperAdmin, b(cc.create));
router.get('/', authenticate, b(cc.getAll));
router.get('/:id', authenticate, b(cc.getById));
router.put('/:id', authenticate, requireSuperAdmin, b(cc.update));
router.get('/:id/stats', authenticate, requireSuperAdmin, b(cc.getStats));
export default router;
