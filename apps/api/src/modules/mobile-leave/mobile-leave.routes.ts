import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { mobileLeaveController } from './mobile-leave.controller';

const router = Router();

router.get('/types', authenticate, mobileLeaveController.getTypes.bind(mobileLeaveController));
router.get('/balances', authenticate, mobileLeaveController.getBalances.bind(mobileLeaveController));
router.get('/requests', authenticate, mobileLeaveController.getRequests.bind(mobileLeaveController));
router.post('/requests', authenticate, mobileLeaveController.createRequest.bind(mobileLeaveController));
router.post('/requests/:id/cancel', authenticate, mobileLeaveController.cancelRequest.bind(mobileLeaveController));

export default router;
