import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service';
import { ApiError } from '../../middleware/errorHandler';

export class CompanyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, nameAr, code, settings } = req.body;
      if (!name || !code) throw new ApiError(400, 'name and code required');
      const company = await companyService.create({ name, nameAr, code, settings });
      res.status(201).json({ success: true, data: { company }, message: 'Company created' });
    } catch (e) { next(e); }
  }
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await companyService.getAll();
      res.json({ success: true, data: { companies } });
    } catch (e) { next(e); }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getById(req.params.id);
      res.json({ success: true, data: { company } });
    } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.update(req.params.id, req.body);
      res.json({ success: true, data: { company }, message: 'Company updated' });
    } catch (e) { next(e); }
  }
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await companyService.getStats(req.params.id);
      res.json({ success: true, data: { stats } });
    } catch (e) { next(e); }
  }
}

export const companyController = new CompanyController();
