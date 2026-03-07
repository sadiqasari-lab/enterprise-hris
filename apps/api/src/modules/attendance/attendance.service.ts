/**
 * Attendance Service
 * Main service for handling attendance check-in/check-out with anti-spoofing
 */

import { PrismaClient } from '@hris/database';
import { AttendanceRuleEngine, CheckInData, FinalValidationResult } from './antiSpoofing/ruleEngine';
import { SelfieValidator } from './antiSpoofing/selfieValidator';
import { DeviceValidator } from './antiSpoofing/deviceValidator';
import { ApiError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class AttendanceService {
  private ruleEngine: AttendanceRuleEngine;
  private selfieValidator: SelfieValidator;
  private deviceValidator: DeviceValidator;

  constructor() {
    this.ruleEngine = new AttendanceRuleEngine();
    this.selfieValidator = new SelfieValidator();
    this.deviceValidator = new DeviceValidator();
  }

  /**
   * Check-in employee
   */
  async checkIn(checkInData: CheckInData): Promise<{
    success: boolean;
    record?: any;
    validation: FinalValidationResult;
    message: string;
  }> {
    // Validate all anti-spoofing checks
    const validation = await this.ruleEngine.validateCheckIn(checkInData);

    // If check-in is blocked, return error
    if (!validation.canCheckIn) {
      return {
        success: false,
        validation,
        message: validation.message || 'Check-in blocked',
      };
    }

    // Save selfie if provided
    let selfiePath: string | undefined;
    let selfieHash: string | undefined;

    if (checkInData.selfie) {
      const imageBuffer = Buffer.from(
        checkInData.selfie.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );

      selfiePath = await this.selfieValidator.saveSelfie(
        imageBuffer,
        checkInData.employeeId,
        checkInData.timestamp
      );

      // Get hash from validation result
      const selfieValidation = validation.validations.find((v) => v.type === 'SELFIE');
      selfieHash = selfieValidation?.metadata?.imageHash;
    }

    // Get device ID
    let deviceId: string | undefined;
    if (checkInData.deviceInfo) {
      // Try to register device or get existing
      const deviceResult = await this.deviceValidator.registerDevice(
        checkInData.employeeId,
        checkInData.deviceInfo,
        false // Don't auto-approve
      );
      deviceId = deviceResult.deviceId;
    }

    // Determine status based on validation
    const status = validation.isValid ? 'VALID' : validation.requiresHRApproval ? 'FLAGGED' : 'REJECTED';

    // Create attendance record
    const record = await prisma.attendanceRecord.create({
      data: {
        company_id: await this.getEmployeeCompanyId(checkInData.employeeId),
        employee_id: checkInData.employeeId,
        location_id: checkInData.locationId,
        device_id: deviceId!,
        check_in_time: checkInData.timestamp,
        gps_latitude: checkInData.gps?.latitude || 0,
        gps_longitude: checkInData.gps?.longitude || 0,
        gps_accuracy: checkInData.gps?.accuracy || 0,
        gps_altitude: checkInData.gps?.altitude,
        gps_speed: checkInData.gps?.speed,
        wifi_ssid: checkInData.wifiSSID,
        selfie_path: selfiePath,
        selfie_hash: selfieHash,
        selfie_metadata: checkInData.selfie ? {} : undefined,
        validation_result: validation as any,
        flags: validation.allFlags,
        status,
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      record,
      validation,
      message: validation.message || 'Check-in successful',
    };
  }

  /**
   * Check-out employee
   */
  async checkOut(
    employeeId: string,
    timestamp: Date
  ): Promise<{
    success: boolean;
    record?: any;
    message: string;
  }> {
    // Find today's check-in record without check-out
    const todayStart = new Date(timestamp);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(timestamp);
    todayEnd.setHours(23, 59, 59, 999);

    const openRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: todayStart,
          lte: todayEnd,
        },
        check_out_time: null,
      },
      orderBy: {
        check_in_time: 'desc',
      },
    });

    if (!openRecord) {
      throw new ApiError(404, 'No open check-in found for today');
    }

    // Update with check-out time
    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: openRecord.id },
      data: {
        check_out_time: timestamp,
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
      },
    });

    return {
      success: true,
      record: updatedRecord,
      message: 'Check-out successful',
    };
  }

  /**
   * Get employee's attendance records
   */
  async getAttendanceRecords(
    employeeId: string,
    companyId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string
  ) {
    const where: any = {
      employee_id: employeeId,
      company_id: companyId,
    };

    if (startDate || endDate) {
      where.check_in_time = {};
      if (startDate) where.check_in_time.gte = startDate;
      if (endDate) where.check_in_time.lte = endDate;
    }

    if (status) {
      where.status = status;
    }

    return await prisma.attendanceRecord.findMany({
      where,
      include: {
        location: {
          select: {
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
    });
  }

  /**
   * Get flagged attendance records for HR review
   */
  async getFlaggedRecords(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = {
      company_id: companyId,
      status: 'FLAGGED',
    };

    if (startDate || endDate) {
      where.check_in_time = {};
      if (startDate) where.check_in_time.gte = startDate;
      if (endDate) where.check_in_time.lte = endDate;
    }

    return await prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_number: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        check_in_time: 'desc',
      },
    });
  }

  /**
   * Approve flagged attendance record
   */
  async approveFlaggedRecord(
    recordId: string,
    approvedBy: string
  ): Promise<any> {
    const record = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: 'APPROVED',
        correction_approved_by: approvedBy,
        correction_approved_at: new Date(),
      },
    });

    return record;
  }

  /**
   * Reject flagged attendance record
   */
  async rejectFlaggedRecord(
    recordId: string,
    rejectedBy: string,
    reason: string
  ): Promise<any> {
    const record = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: 'REJECTED',
        correction_approved_by: rejectedBy,
        correction_approved_at: new Date(),
        correction_reason: reason,
      },
    });

    return record;
  }

  /**
   * Request attendance correction
   */
  async requestCorrection(
    recordId: string,
    reason: string
  ): Promise<any> {
    const record = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        correction_requested: true,
        correction_reason: reason,
        status: 'FLAGGED',
      },
    });

    return record;
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(
    employeeId: string,
    month: number,
    year: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.getAttendanceRecords(
      employeeId,
      await this.getEmployeeCompanyId(employeeId),
      startDate,
      endDate
    );

    const totalDays = records.length;
    const validDays = records.filter((r) => r.status === 'VALID').length;
    const flaggedDays = records.filter((r) => r.status === 'FLAGGED').length;
    const rejectedDays = records.filter((r) => r.status === 'REJECTED').length;

    return {
      month,
      year,
      totalDays,
      validDays,
      flaggedDays,
      rejectedDays,
      records,
    };
  }

  /**
   * Helper: Get employee's company ID
   */
  private async getEmployeeCompanyId(employeeId: string): Promise<string> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { company_id: true },
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    return employee.company_id;
  }
}

export const attendanceService = new AttendanceService();
