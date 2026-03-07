import { Request, Response, NextFunction } from 'express';
import { trainingService } from './training.service';
import { ApiError } from '../../middleware/errorHandler';

export class TrainingController {
  async createTraining(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, titleAr, provider, startDate, endDate } = req.body;
      if (!title || !startDate || !endDate) throw new ApiError(400, 'title, startDate, endDate required');
      const training = await trainingService.createTraining(req.params.employeeId, { title, titleAr, provider, startDate: new Date(startDate), endDate: new Date(endDate) });
      res.status(201).json({ success: true, data: { training }, message: 'Training record created' });
    } catch (e) { next(e); }
  }
  async getTrainings(req: Request, res: Response, next: NextFunction) {
    try {
      const { trainings, total } = await trainingService.getTrainings({
        employeeId: req.query.employeeId as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      });
      res.json({ success: true, data: { trainings, total } });
    } catch (e) { next(e); }
  }
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.status) throw new ApiError(400, 'status required');
      const training = await trainingService.updateStatus(req.params.id, req.body.status);
      res.json({ success: true, data: { training }, message: 'Training status updated' });
    } catch (e) { next(e); }
  }
  async addCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, nameAr, issuingOrg, issueDate, expiryDate, certificatePath } = req.body;
      if (!name || !issuingOrg || !issueDate) throw new ApiError(400, 'name, issuingOrg, issueDate required');
      const cert = await trainingService.addCertification(req.params.employeeId, { name, nameAr, issuingOrg, issueDate: new Date(issueDate), expiryDate: expiryDate ? new Date(expiryDate) : undefined, certificatePath });
      res.status(201).json({ success: true, data: { certification: cert }, message: 'Certification added' });
    } catch (e) { next(e); }
  }
  async getCertifications(req: Request, res: Response, next: NextFunction) {
    try {
      const certs = await trainingService.getCertifications(req.params.employeeId);
      res.json({ success: true, data: { certifications: certs } });
    } catch (e) { next(e); }
  }
}

export const trainingController = new TrainingController();
