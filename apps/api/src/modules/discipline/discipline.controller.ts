import { Request, Response, NextFunction } from 'express';
import { disciplineService } from './discipline.service';
import { ApiError } from '../../middleware/errorHandler';

export class DisciplineController {
  async createIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, incidentDate, type, description, severity } = req.body;
      if (!employeeId || !incidentDate || !type || !description || !severity)
        throw new ApiError(400, 'employeeId, incidentDate, type, description, severity required');
      const incident = await disciplineService.createIncident(req.companyId!, req.userId!, { employeeId, incidentDate: new Date(incidentDate), type, description, severity });
      res.status(201).json({ success: true, data: { incident }, message: 'Disciplinary incident created' });
    } catch (e) { next(e); }
  }
  async getIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const incidents = await disciplineService.getIncidents(req.companyId!, { employeeId: req.query.employeeId as string, status: req.query.status as string, severity: req.query.severity as string });
      res.json({ success: true, data: { incidents } });
    } catch (e) { next(e); }
  }
  async getIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const incident = await disciplineService.getIncidentById(req.params.id);
      res.json({ success: true, data: { incident } });
    } catch (e) { next(e); }
  }
  async addAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { actionType, description, approvedBy } = req.body;
      if (!actionType || !description) throw new ApiError(400, 'actionType and description required');
      const action = await disciplineService.addAction(req.params.id, { actionType, description, approvedBy });
      res.status(201).json({ success: true, data: { action }, message: 'Action added' });
    } catch (e) { next(e); }
  }
  async resolveIncident(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.resolution) throw new ApiError(400, 'resolution required');
      const incident = await disciplineService.resolveIncident(req.params.id, req.body.resolution);
      res.json({ success: true, data: { incident }, message: 'Incident resolved' });
    } catch (e) { next(e); }
  }
}

export const disciplineController = new DisciplineController();
