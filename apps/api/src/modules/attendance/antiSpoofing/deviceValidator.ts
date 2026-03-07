/**
 * Device Validator
 * Validates device binding for attendance
 */

import { PrismaClient } from '@hris/database';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface DeviceInfo {
  model: string;
  os: string;
  osVersion?: string;
  appVersion?: string;
  deviceId?: string; // Unique device identifier from mobile app
}

export interface DeviceValidationResult {
  isValid: boolean;
  flags: string[];
  deviceId?: string;
  isNewDevice: boolean;
  requiresApproval: boolean;
  message?: string;
}

export class DeviceValidator {
  /**
   * Validate device for attendance
   */
  async validate(
    employeeId: string,
    deviceInfo: DeviceInfo
  ): Promise<DeviceValidationResult> {
    const flags: string[] = [];

    // Generate device fingerprint
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);

    // Check if device is registered
    const existingDevice = await prisma.attendanceDevice.findUnique({
      where: { device_fingerprint: deviceFingerprint },
    });

    // New device detected
    if (!existingDevice) {
      flags.push('DEVICE_NOT_REGISTERED');

      return {
        isValid: false,
        flags,
        deviceId: undefined,
        isNewDevice: true,
        requiresApproval: true,
        message: 'This device is not registered. Please contact HR to approve this device.',
      };
    }

    // Check if device belongs to this employee
    if (existingDevice.employee_id !== employeeId) {
      flags.push('DEVICE_BELONGS_TO_ANOTHER_EMPLOYEE');

      return {
        isValid: false,
        flags,
        deviceId: existingDevice.id,
        isNewDevice: false,
        requiresApproval: false,
        message: 'This device is registered to another employee',
      };
    }

    // Check if device is approved
    if (!existingDevice.is_approved) {
      flags.push('DEVICE_NOT_APPROVED');

      return {
        isValid: false,
        flags,
        deviceId: existingDevice.id,
        isNewDevice: false,
        requiresApproval: true,
        message: 'This device is pending approval from HR',
      };
    }

    // Check if device is active
    if (!existingDevice.is_active) {
      flags.push('DEVICE_DEACTIVATED');

      return {
        isValid: false,
        flags,
        deviceId: existingDevice.id,
        isNewDevice: false,
        requiresApproval: false,
        message: 'This device has been deactivated',
      };
    }

    // Device is valid
    return {
      isValid: true,
      flags: [],
      deviceId: existingDevice.id,
      isNewDevice: false,
      requiresApproval: false,
    };
  }

  /**
   * Generate device fingerprint
   * Creates a unique identifier based on device characteristics
   */
  generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const fingerprint = `${deviceInfo.model}|${deviceInfo.os}|${deviceInfo.osVersion || ''}|${deviceInfo.deviceId || ''}`;

    // Hash the fingerprint for privacy
    return crypto
      .createHash('sha256')
      .update(fingerprint)
      .digest('hex');
  }

  /**
   * Register new device
   */
  async registerDevice(
    employeeId: string,
    deviceInfo: DeviceInfo,
    autoApprove: boolean = false
  ): Promise<{ deviceId: string; requiresApproval: boolean }> {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);

    // Check if device already exists
    const existingDevice = await prisma.attendanceDevice.findUnique({
      where: { device_fingerprint: deviceFingerprint },
    });

    if (existingDevice) {
      return {
        deviceId: existingDevice.id,
        requiresApproval: !existingDevice.is_approved,
      };
    }

    // Create new device
    const device = await prisma.attendanceDevice.create({
      data: {
        employee_id: employeeId,
        device_model: deviceInfo.model,
        device_os: `${deviceInfo.os} ${deviceInfo.osVersion || ''}`.trim(),
        device_fingerprint: deviceFingerprint,
        is_approved: autoApprove,
        is_active: true,
        ...(autoApprove && {
          approved_at: new Date(),
        }),
      },
    });

    return {
      deviceId: device.id,
      requiresApproval: !autoApprove,
    };
  }

  /**
   * Approve device
   */
  async approveDevice(
    deviceId: string,
    approvedBy: string
  ): Promise<void> {
    await prisma.attendanceDevice.update({
      where: { id: deviceId },
      data: {
        is_approved: true,
        approved_by: approvedBy,
        approved_at: new Date(),
      },
    });
  }

  /**
   * Deactivate device
   */
  async deactivateDevice(deviceId: string): Promise<void> {
    await prisma.attendanceDevice.update({
      where: { id: deviceId },
      data: {
        is_active: false,
      },
    });
  }

  /**
   * Get employee's registered devices
   */
  async getEmployeeDevices(employeeId: string) {
    return await prisma.attendanceDevice.findMany({
      where: { employee_id: employeeId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get pending device approvals
   */
  async getPendingApprovals(companyId?: string) {
    const where: any = {
      is_approved: false,
    };

    if (companyId) {
      // Join with employee to filter by company
      // This would need adjustment based on actual schema
    }

    return await prisma.attendanceDevice.findMany({
      where,
      include: {
        // Include employee details
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Check if device change is suspicious
   */
  async isSuspiciousDeviceChange(
    employeeId: string,
    newDeviceFingerprint: string
  ): Promise<boolean> {
    // Get employee's recent attendance records
    const recentRecords = await prisma.attendanceRecord.findMany({
      where: { employee_id: employeeId },
      orderBy: { check_in_time: 'desc' },
      take: 10,
      include: {
        device: true,
      },
    });

    if (recentRecords.length === 0) {
      return false;
    }

    // Check if employee frequently changes devices (suspicious)
    const uniqueDevices = new Set(
      recentRecords.map((record) => record.device.device_fingerprint)
    );

    // If more than 3 different devices in last 10 records, flag as suspicious
    return uniqueDevices.size > 3;
  }
}
