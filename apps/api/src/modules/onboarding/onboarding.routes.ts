import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole } from '../../middleware/rbac.middleware';
import { onboardingController } from './onboarding.controller';

const router = Router();

router.get(
  '/onboarding/checklists',
  authenticate,
  requireAnyRole(['SUPER_ADMIN', 'HR_ADMIN', 'HR_OFFICER', 'GM', 'MANAGER']),
  onboardingController.listChecklists.bind(onboardingController)
);

router.post(
  '/onboarding/checklists',
  authenticate,
  requireAnyRole(['SUPER_ADMIN', 'HR_ADMIN', 'HR_OFFICER']),
  onboardingController.createChecklist.bind(onboardingController)
);

router.get(
  '/employees/:id/onboarding',
  authenticate,
  onboardingController.getEmployeeChecklist.bind(onboardingController)
);

router.put(
  '/employees/:id/onboarding/tasks/:taskId',
  authenticate,
  onboardingController.updateTask.bind(onboardingController)
);

export default router;
