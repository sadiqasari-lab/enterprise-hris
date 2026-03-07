import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../middleware/errorHandler';
import { onboardingService } from './onboarding.service';

export class OnboardingController {
  async listChecklists(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { status, employeeId } = req.query;

      const checklists = await onboardingService.listChecklists(
        companyId,
        status as string | undefined,
        employeeId as string | undefined
      );

      res.status(200).json({
        success: true,
        data: { checklists },
      });
    } catch (error) {
      next(error);
    }
  }

  async createChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, tasks } = req.body;

      if (!employeeId) {
        throw new ApiError(400, 'employeeId is required');
      }

      const checklist = await onboardingService.createChecklist(employeeId, tasks);

      res.status(201).json({
        success: true,
        data: { checklist },
        message: 'Onboarding checklist created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.params.id;
      const canAccess = await onboardingService.canAccessEmployeeChecklist(
        req.userId!,
        employeeId,
        req.user?.roles || []
      );

      if (!canAccess) {
        throw new ApiError(403, 'You can only view your own onboarding checklist');
      }

      const checklist = await onboardingService.getEmployeeChecklist(employeeId);

      res.status(200).json({
        success: true,
        data: { checklist },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.params.id;
      const taskId = req.params.taskId;
      const { isCompleted } = req.body;

      const canAccess = await onboardingService.canAccessEmployeeChecklist(
        req.userId!,
        employeeId,
        req.user?.roles || []
      );

      if (!canAccess) {
        throw new ApiError(403, 'You can only update your own onboarding tasks');
      }

      const checklist = await onboardingService.updateTask(
        employeeId,
        taskId,
        typeof isCompleted === 'boolean' ? isCompleted : true,
        req.userId!
      );

      res.status(200).json({
        success: true,
        data: { checklist },
        message: 'Onboarding task updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const onboardingController = new OnboardingController();
