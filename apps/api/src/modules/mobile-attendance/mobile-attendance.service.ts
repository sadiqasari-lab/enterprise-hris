import { PrismaClient } from '@hris/database';
import { ApiError } from '../../middleware/errorHandler';
import { attendanceService } from '../attendance/attendance.service';

const prisma = new PrismaClient();

interface MobileCheckInInput {
  locationId?: string;
  gps?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
  };
  selfie?: string;
  wifiSSID?: string;
  deviceInfo?: {
    model?: string;
    os?: string;
    osVersion?: string;
    appVersion?: string;
    fingerprint?: string;
    [key: string]: any;
  };
}

interface MobileHistoryQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: string | number;
  limit?: string | number;
}

export class MobileAttendanceService {
  private async resolveEmployeeFromUser(userId: string): Promise<{
    userId: string;
    companyId: string;
    employeeId: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        company_id: true,
        employee_id: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.employee_id) {
      throw new ApiError(404, 'Employee profile not linked to this user');
    }

    return {
      userId: user.id,
      companyId: user.company_id,
      employeeId: user.employee_id,
    };
  }

  private async getDefaultLocationId(companyId: string): Promise<string | null> {
    const location = await prisma.attendanceLocation.findFirst({
      where: {
        company_id: companyId,
        is_active: true,
      },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        id: true,
      },
    });

    return location?.id || null;
  }

  async checkIn(userId: string, payload: MobileCheckInInput): Promise<any> {
    const { employeeId, companyId } = await this.resolveEmployeeFromUser(userId);
    const locationId = payload.locationId || (await this.getDefaultLocationId(companyId));

    if (!locationId) {
      throw new ApiError(400, 'Location ID is required');
    }

    return attendanceService.checkIn({
      employeeId,
      locationId,
      gps: payload.gps
        ? {
            latitude: payload.gps.latitude,
            longitude: payload.gps.longitude,
            accuracy: payload.gps.accuracy,
            altitude: payload.gps.altitude,
            speed: payload.gps.speed,
            timestamp: new Date(),
          }
        : undefined,
      selfie: payload.selfie,
      wifiSSID: payload.wifiSSID,
      deviceInfo: payload.deviceInfo
        ? {
            model: payload.deviceInfo.model || 'Unknown',
            os: payload.deviceInfo.os || 'Unknown',
            deviceId: payload.deviceInfo.fingerprint,
            osVersion: payload.deviceInfo.osVersion,
            appVersion: payload.deviceInfo.appVersion,
          }
        : undefined,
      timestamp: new Date(),
    });
  }

  async checkOut(userId: string): Promise<any> {
    const { employeeId } = await this.resolveEmployeeFromUser(userId);
    return attendanceService.checkOut(employeeId, new Date());
  }

  async getStatus(userId: string): Promise<any> {
    const { employeeId, companyId } = await this.resolveEmployeeFromUser(userId);
    const defaultLocationId = await this.getDefaultLocationId(companyId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const openRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
        check_out_time: null,
      },
      orderBy: {
        check_in_time: 'desc',
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const lastRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employee_id: employeeId,
      },
      orderBy: {
        check_in_time: 'desc',
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      checkedIn: !!openRecord,
      canCheckIn: !openRecord,
      canCheckOut: !!openRecord,
      defaultLocationId,
      openRecord,
      lastRecord,
      serverTime: new Date().toISOString(),
    };
  }

  async getHistory(userId: string, query: MobileHistoryQuery): Promise<any> {
    const { employeeId, companyId } = await this.resolveEmployeeFromUser(userId);
    const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      employee_id: employeeId,
      company_id: companyId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.check_in_time = {};
      if (query.startDate) {
        where.check_in_time.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.check_in_time.lte = new Date(query.endDate);
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          device: {
            select: {
              device_model: true,
              device_os: true,
            },
          },
        },
        orderBy: {
          check_in_time: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const mobileAttendanceService = new MobileAttendanceService();
