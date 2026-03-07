/**
 * Recruitment / ATS Service
 * JobPosting → Applicant → Interview → Feedback → Hire/Reject
 */

import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class RecruitmentService {
  // ── Job Postings ─────────────────────────────────────
  async createJobPosting(companyId: string, createdBy: string, data: {
    title: string; titleAr?: string;
    description: string; descriptionAr?: string;
    departmentId?: string; requirements?: any;
  }): Promise<any> {
    return prisma.jobPosting.create({
      data: {
        company_id: companyId,
        created_by: createdBy,
        title: data.title,
        title_ar: data.titleAr ?? null,
        description: data.description,
        description_ar: data.descriptionAr ?? null,
        department_id: data.departmentId ?? null,
        requirements: data.requirements ?? null,
        status: 'DRAFT',
      },
    });
  }

  async getJobPostings(companyId: string, filters: { status?: string; departmentId?: string }): Promise<any[]> {
    return prisma.jobPosting.findMany({
      where: {
        company_id: companyId,
        ...(filters.status && { status: filters.status }),
        ...(filters.departmentId && { department_id: filters.departmentId }),
      },
      include: { applicants: { select: { id: true, status: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getJobPostingById(id: string): Promise<any> {
    const posting = await prisma.jobPosting.findUnique({
      where: { id },
      include: { applicants: { include: { interviews: true } } },
    });
    if (!posting) throw new ApiError(404, 'Job posting not found');
    return posting;
  }

  async updatePostingStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'): Promise<any> {
    const posting = await prisma.jobPosting.findUnique({ where: { id } });
    if (!posting) throw new ApiError(404, 'Job posting not found');

    const updates: any = { status };
    if (status === 'PUBLISHED') updates.published_at = new Date();
    if (status === 'CLOSED') updates.closed_at = new Date();

    return prisma.jobPosting.update({ where: { id }, data: updates });
  }

  // ── Applicants ───────────────────────────────────────
  async createApplicant(jobPostingId: string, data: {
    firstName: string; lastName: string;
    email: string; phone: string;
    resumePath?: string;
  }): Promise<any> {
    const posting = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!posting) throw new ApiError(404, 'Job posting not found');
    if (posting.status !== 'PUBLISHED') throw new ApiError(400, 'Job posting is not open for applications');

    // Duplicate email per posting check
    const dup = await prisma.applicant.findFirst({ where: { job_posting_id: jobPostingId, email: data.email } });
    if (dup) throw new ApiError(409, 'An application with this email already exists for this position');

    return prisma.applicant.create({
      data: {
        job_posting_id: jobPostingId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        resume_path: data.resumePath ?? null,
        status: 'NEW',
      },
      include: { job_posting: true },
    });
  }

  async getApplicants(filters: { jobPostingId?: string; status?: string; page?: number; limit?: number }): Promise<{ applicants: any[]; total: number }> {
    const { page = 1, limit = 20 } = filters;
    const where: any = {};
    if (filters.jobPostingId) where.job_posting_id = filters.jobPostingId;
    if (filters.status) where.status = filters.status;

    const [applicants, total] = await Promise.all([
      prisma.applicant.findMany({
        where,
        include: { job_posting: true, interviews: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.applicant.count({ where }),
    ]);
    return { applicants, total };
  }

  async updateApplicantStatus(id: string, status: string): Promise<any> {
    const validStatuses = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
    if (!validStatuses.includes(status)) throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);

    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant) throw new ApiError(404, 'Applicant not found');

    return prisma.applicant.update({
      where: { id },
      data: { status },
      include: { job_posting: true, interviews: true },
    });
  }

  // ── Interviews ───────────────────────────────────────
  async scheduleInterview(applicantId: string, data: {
    scheduledAt: Date; interviewerIds: string[];
    type: 'PHONE' | 'VIDEO' | 'IN_PERSON';
  }): Promise<any> {
    const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    if (!applicant) throw new ApiError(404, 'Applicant not found');

    if (!data.interviewerIds.length) throw new ApiError(400, 'At least one interviewer is required');

    const interview = await prisma.interview.create({
      data: {
        applicant_id: applicantId,
        scheduled_at: data.scheduledAt,
        interviewer_ids: data.interviewerIds,
        type: data.type,
        status: 'SCHEDULED',
      },
      include: { applicant: true },
    });

    // Move applicant to INTERVIEW stage if not already there
    if (applicant.status !== 'INTERVIEW') {
      await prisma.applicant.update({ where: { id: applicantId }, data: { status: 'INTERVIEW' } });
    }

    return interview;
  }

  async getInterviews(applicantId: string): Promise<any[]> {
    return prisma.interview.findMany({
      where: { applicant_id: applicantId },
      include: { feedback: true },
      orderBy: { scheduled_at: 'desc' },
    });
  }

  async completeInterview(interviewId: string): Promise<any> {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new ApiError(404, 'Interview not found');
    if (interview.status !== 'SCHEDULED') throw new ApiError(400, 'Only SCHEDULED interviews can be completed');

    return prisma.interview.update({ where: { id: interviewId }, data: { status: 'COMPLETED' } });
  }

  // ── Feedback ─────────────────────────────────────────
  async submitFeedback(interviewId: string, interviewerId: string, data: {
    rating: number; feedback: string; recommendation: string;
  }): Promise<any> {
    if (data.rating < 1 || data.rating > 5) throw new ApiError(400, 'Rating must be 1-5');
    const validRecs = ['STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO'];
    if (!validRecs.includes(data.recommendation)) throw new ApiError(400, `recommendation must be one of: ${validRecs.join(', ')}`);

    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new ApiError(404, 'Interview not found');

    // one feedback per interviewer per interview
    const dup = await prisma.interviewFeedback.findFirst({ where: { interview_id: interviewId, interviewer_id: interviewerId } });
    if (dup) throw new ApiError(409, 'You already submitted feedback for this interview');

    return prisma.interviewFeedback.create({
      data: {
        interview_id: interviewId,
        interviewer_id: interviewerId,
        rating: data.rating,
        feedback: data.feedback,
        recommendation: data.recommendation,
      },
    });
  }

  // ── Hire (convert applicant → employee) ─────────────
  async hireApplicant(applicantId: string, employeeData: {
    companyId: string; employeeNumber: string;
    departmentId: string; position: string; hireDate: Date;
  }): Promise<any> {
    const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
    if (!applicant) throw new ApiError(404, 'Applicant not found');
    if (applicant.status !== 'OFFER') throw new ApiError(400, 'Applicant must be in OFFER status to be hired');

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        company_id: employeeData.companyId,
        employee_number: employeeData.employeeNumber,
        first_name: applicant.first_name,
        last_name: applicant.last_name,
        email: applicant.email,
        phone: applicant.phone,
        department_id: employeeData.departmentId,
        position: employeeData.position,
        hire_date: employeeData.hireDate,
        status: 'ACTIVE',
      },
    });

    // Link applicant → employee and set HIRED
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: 'HIRED', employee_id: employee.id },
    });

    return { employee, applicant: { ...applicant, status: 'HIRED' } };
  }
}

export const recruitmentService = new RecruitmentService();
