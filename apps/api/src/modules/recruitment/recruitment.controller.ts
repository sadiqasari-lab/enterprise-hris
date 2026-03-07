import { Request, Response, NextFunction } from 'express';
import { recruitmentService } from './recruitment.service';
import { ApiError } from '../../middleware/errorHandler';

export class RecruitmentController {
  // Job Postings
  async createPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const posting = await recruitmentService.createJobPosting(req.companyId!, req.userId!, req.body);
      res.status(201).json({ success: true, data: { posting }, message: 'Job posting created' });
    } catch (e) { next(e); }
  }
  async getPostings(req: Request, res: Response, next: NextFunction) {
    try {
      const postings = await recruitmentService.getJobPostings(req.companyId!, { status: req.query.status as string, departmentId: req.query.departmentId as string });
      res.json({ success: true, data: { postings } });
    } catch (e) { next(e); }
  }
  async getPosting(req: Request, res: Response, next: NextFunction) {
    try {
      const posting = await recruitmentService.getJobPostingById(req.params.id);
      res.json({ success: true, data: { posting } });
    } catch (e) { next(e); }
  }
  async updatePostingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.status) throw new ApiError(400, 'status required');
      const posting = await recruitmentService.updatePostingStatus(req.params.id, req.body.status);
      res.json({ success: true, data: { posting }, message: `Posting ${req.body.status.toLowerCase()}` });
    } catch (e) { next(e); }
  }

  // Applicants
  async createApplicant(req: Request, res: Response, next: NextFunction) {
    try {
      const applicant = await recruitmentService.createApplicant(req.params.jobPostingId, req.body);
      res.status(201).json({ success: true, data: { applicant }, message: 'Application submitted' });
    } catch (e) { next(e); }
  }
  async getApplicants(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicants, total } = await recruitmentService.getApplicants({
        jobPostingId: req.query.jobPostingId as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      });
      res.json({ success: true, data: { applicants, total } });
    } catch (e) { next(e); }
  }
  async updateApplicantStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.status) throw new ApiError(400, 'status required');
      const applicant = await recruitmentService.updateApplicantStatus(req.params.id, req.body.status);
      res.json({ success: true, data: { applicant }, message: 'Applicant status updated' });
    } catch (e) { next(e); }
  }

  // Interviews
  async scheduleInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { scheduledAt, interviewerIds, type } = req.body;
      if (!scheduledAt || !type) throw new ApiError(400, 'scheduledAt and type required');
      const interview = await recruitmentService.scheduleInterview(req.params.applicantId, { scheduledAt: new Date(scheduledAt), interviewerIds: interviewerIds || [], type });
      res.status(201).json({ success: true, data: { interview }, message: 'Interview scheduled' });
    } catch (e) { next(e); }
  }
  async getInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      const interviews = await recruitmentService.getInterviews(req.params.applicantId);
      res.json({ success: true, data: { interviews } });
    } catch (e) { next(e); }
  }
  async completeInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await recruitmentService.completeInterview(req.params.id);
      res.json({ success: true, data: { interview }, message: 'Interview completed' });
    } catch (e) { next(e); }
  }

  // Feedback
  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const feedback = await recruitmentService.submitFeedback(req.params.id, req.userId!, req.body);
      res.status(201).json({ success: true, data: { feedback }, message: 'Feedback submitted' });
    } catch (e) { next(e); }
  }

  // Hire
  async hireApplicant(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentService.hireApplicant(req.params.id, { ...req.body, companyId: req.companyId!, hireDate: new Date(req.body.hireDate) });
      res.status(201).json({ success: true, data: result, message: 'Applicant hired and employee record created' });
    } catch (e) { next(e); }
  }
}

export const recruitmentController = new RecruitmentController();
