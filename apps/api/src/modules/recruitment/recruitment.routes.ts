import { Router } from 'express';
import { recruitmentController as rc } from './recruitment.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireAnyRole, requireHRAdmin } from '../../middleware/rbac.middleware';

const router = Router();
const b = (fn: any) => fn.bind(rc);
const hrUp = requireAnyRole(['HR_OFFICER','HR_ADMIN','SUPER_ADMIN']);

// Job Postings
router.post('/postings', authenticate, hrUp, b(rc.createPosting));
router.get('/postings', authenticate, b(rc.getPostings));
router.get('/postings/:id', authenticate, b(rc.getPosting));
router.patch('/postings/:id/status', authenticate, hrUp, b(rc.updatePostingStatus));

// Applicants  (public create for external candidates; internal reads are guarded)
router.post('/postings/:jobPostingId/applicants', b(rc.createApplicant));   // intentionally no auth – external apply
router.get('/applicants', authenticate, hrUp, b(rc.getApplicants));
router.patch('/applicants/:id/status', authenticate, hrUp, b(rc.updateApplicantStatus));

// Interviews
router.post('/applicants/:applicantId/interviews', authenticate, hrUp, b(rc.scheduleInterview));
router.get('/applicants/:applicantId/interviews', authenticate, hrUp, b(rc.getInterviews));
router.post('/interviews/:id/complete', authenticate, hrUp, b(rc.completeInterview));
router.post('/interviews/:id/feedback', authenticate, hrUp, b(rc.submitFeedback));

// Hire
router.post('/applicants/:id/hire', authenticate, requireHRAdmin, b(rc.hireApplicant));

export default router;
