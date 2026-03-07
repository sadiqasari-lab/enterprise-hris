import { Request, Response, NextFunction } from 'express';
import { terminationService } from './termination.service';
import { ApiError } from '../../middleware/errorHandler';

export class TerminationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, terminationType, noticeDate, lastWorkingDay, reason } = req.body;
      if (!employeeId || !terminationType || !noticeDate || !lastWorkingDay)
        throw new ApiError(400, 'employeeId, terminationType, noticeDate, lastWorkingDay required');
      const t = await terminationService.create(req.companyId!, { employeeId, terminationType, noticeDate: new Date(noticeDate), lastWorkingDay: new Date(lastWorkingDay), reason });
      res.status(201).json({ success: true, data: { termination: t }, message: 'Termination initiated' });
    } catch (e) { next(e); }
  }
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const terminations = await terminationService.getAll(req.companyId!, { status: req.query.status as string, type: req.query.type as string });
      res.json({ success: true, data: { terminations } });
    } catch (e) { next(e); }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await terminationService.getById(req.params.id);
      res.json({ success: true, data: { termination: t } });
    } catch (e) { next(e); }
  }
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await terminationService.approve(req.params.id, req.userId!);
      res.json({ success: true, data: { termination: t }, message: 'Termination approved' });
    } catch (e) { next(e); }
  }
  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await terminationService.complete(req.params.id, req.body.settlementAmount);
      res.json({ success: true, data: { termination: t }, message: 'Termination completed' });
    } catch (e) { next(e); }
  }
  async updateChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.items) throw new ApiError(400, 'items required');
      const checklist = await terminationService.updateChecklist(req.params.id, req.body.items);
      res.json({ success: true, data: { checklist }, message: 'Checklist updated' });
    } catch (e) { next(e); }
  }
}

export const terminationController = new TerminationController();
