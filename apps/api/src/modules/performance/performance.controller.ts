import { Request, Response, NextFunction } from 'express';
import { performanceService } from './performance.service';
import { ApiError } from '../../middleware/errorHandler';

export class PerformanceController {
  // Cycles
  async createCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, nameAr, startDate, endDate } = req.body;
      if (!name || !startDate || !endDate) throw new ApiError(400, 'name, startDate, endDate required');
      const cycle = await performanceService.createCycle(req.companyId!, { name, nameAr, startDate: new Date(startDate), endDate: new Date(endDate) });
      res.status(201).json({ success: true, data: { cycle }, message: 'Performance cycle created' });
    } catch (e) { next(e); }
  }

  async getCycles(req: Request, res: Response, next: NextFunction) {
    try {
      const cycles = await performanceService.getCycles(req.companyId!, req.query.status as string);
      res.json({ success: true, data: { cycles } });
    } catch (e) { next(e); }
  }

  async getCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const cycle = await performanceService.getCycleById(req.params.id);
      res.json({ success: true, data: { cycle } });
    } catch (e) { next(e); }
  }

  async completeCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const cycle = await performanceService.completeCycle(req.params.id);
      res.json({ success: true, data: { cycle }, message: 'Cycle completed' });
    } catch (e) { next(e); }
  }

  // Goals
  async createGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { title, titleAr, description, targetDate } = req.body;
      if (!title || !targetDate) throw new ApiError(400, 'title and targetDate required');
      const goal = await performanceService.createGoal(employeeId, { title, titleAr, description, targetDate: new Date(targetDate) });
      res.status(201).json({ success: true, data: { goal }, message: 'Goal created' });
    } catch (e) { next(e); }
  }

  async getGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const goals = await performanceService.getGoals({ employeeId: req.query.employeeId as string, status: req.query.status as string });
      res.json({ success: true, data: { goals } });
    } catch (e) { next(e); }
  }

  async updateGoalProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { progress, status } = req.body;
      if (progress === undefined) throw new ApiError(400, 'progress is required');
      const goal = await performanceService.updateGoalProgress(req.params.id, progress, status);
      res.json({ success: true, data: { goal }, message: 'Goal updated' });
    } catch (e) { next(e); }
  }

  // Appraisals
  async createAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const { cycleId, employeeId } = req.params;
      const appraisal = await performanceService.createAppraisal(cycleId, employeeId, req.userId!);
      res.status(201).json({ success: true, data: { appraisal }, message: 'Appraisal created' });
    } catch (e) { next(e); }
  }

  async getAppraisals(req: Request, res: Response, next: NextFunction) {
    try {
      const appraisals = await performanceService.getAppraisals({
        cycleId: req.query.cycleId as string,
        employeeId: req.query.employeeId as string,
        reviewerId: req.query.reviewerId as string,
        status: req.query.status as string,
      });
      res.json({ success: true, data: { appraisals } });
    } catch (e) { next(e); }
  }

  async submitAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating, feedback, strengths, areasForImprovement } = req.body;
      if (!rating || !feedback) throw new ApiError(400, 'rating and feedback required');
      const appraisal = await performanceService.submitAppraisal(req.params.id, { rating, feedback, strengths, areasForImprovement });
      res.json({ success: true, data: { appraisal }, message: 'Appraisal submitted' });
    } catch (e) { next(e); }
  }

  async acknowledgeAppraisal(req: Request, res: Response, next: NextFunction) {
    try {
      const appraisal = await performanceService.acknowledgeAppraisal(req.params.id);
      res.json({ success: true, data: { appraisal }, message: 'Appraisal acknowledged' });
    } catch (e) { next(e); }
  }

  async getCycleStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await performanceService.getCycleStats(req.params.id);
      res.json({ success: true, data: { stats } });
    } catch (e) { next(e); }
  }
}

export const performanceController = new PerformanceController();
