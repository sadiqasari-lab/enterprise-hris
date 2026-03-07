import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
const prisma = new PrismaClient();

export class DisciplineService {
  async createIncident(companyId: string, reportedBy: string, data: {
    employeeId: string; incidentDate: Date; type: string;
    description: string; severity: string;
  }): Promise<any> {
    const validTypes = ['WARNING', 'SUSPENSION', 'TERMINATION_NOTICE'];
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validTypes.includes(data.type)) throw new ApiError(400, `type must be: ${validTypes.join(', ')}`);
    if (!validSeverities.includes(data.severity)) throw new ApiError(400, `severity must be: ${validSeverities.join(', ')}`);

    const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!emp) throw new ApiError(404, 'Employee not found');

    return prisma.disciplinaryIncident.create({
      data: {
        company_id: companyId,
        employee_id: data.employeeId,
        incident_date: data.incidentDate,
        type: data.type,
        description: data.description,
        severity: data.severity,
        reported_by: reportedBy,
        status: 'PENDING',
      },
      include: { employee: { select: { first_name: true, last_name: true, department_id: true } }, actions: true },
    });
  }

  async getIncidents(companyId: string, filters: { employeeId?: string; status?: string; severity?: string }): Promise<any[]> {
    return prisma.disciplinaryIncident.findMany({
      where: {
        company_id: companyId,
        ...(filters.employeeId && { employee_id: filters.employeeId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.severity && { severity: filters.severity }),
      },
      include: { employee: { select: { first_name: true, last_name: true } }, actions: true },
      orderBy: { incident_date: 'desc' },
    });
  }

  async getIncidentById(id: string): Promise<any> {
    const inc = await prisma.disciplinaryIncident.findUnique({ where: { id }, include: { employee: true, actions: true } });
    if (!inc) throw new ApiError(404, 'Incident not found');
    return inc;
  }

  async addAction(incidentId: string, data: { actionType: string; description: string; approvedBy?: string }): Promise<any> {
    const validActions = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'SUSPENSION', 'TERMINATION'];
    if (!validActions.includes(data.actionType)) throw new ApiError(400, `actionType must be: ${validActions.join(', ')}`);

    const inc = await prisma.disciplinaryIncident.findUnique({ where: { id: incidentId } });
    if (!inc) throw new ApiError(404, 'Incident not found');

    const action = await prisma.disciplinaryAction.create({
      data: {
        incident_id: incidentId,
        action_type: data.actionType,
        action_date: new Date(),
        description: data.description,
        approved_by: data.approvedBy ?? null,
      },
    });

    // Update incident status to UNDER_REVIEW
    if (inc.status === 'PENDING') {
      await prisma.disciplinaryIncident.update({ where: { id: incidentId }, data: { status: 'UNDER_REVIEW' } });
    }
    return action;
  }

  async resolveIncident(id: string, resolution: string): Promise<any> {
    const inc = await prisma.disciplinaryIncident.findUnique({ where: { id } });
    if (!inc) throw new ApiError(404, 'Incident not found');
    if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') throw new ApiError(400, `Incident already ${inc.status}`);

    return prisma.disciplinaryIncident.update({
      where: { id },
      data: { status: 'RESOLVED', resolution, resolved_at: new Date() },
      include: { employee: { select: { first_name: true, last_name: true } }, actions: true },
    });
  }
}

export const disciplineService = new DisciplineService();
