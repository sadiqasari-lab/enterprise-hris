/**
 * Attendance Rule Engine
 * Combines all anti-spoofing validators based on configurable rules
 */

import { PrismaClient } from '@hris/database';
import { GPSValidator, GPSCoordinates, GPSValidationResult } from './gpsValidator';
import { SelfieValidator, SelfieValidationResult } from './selfieValidator';
import { WiFiValidator, WiFiValidationResult } from './wifiValidator';
import { DeviceValidator, DeviceInfo, DeviceValidationResult } from './deviceValidator';
import { BehaviorAnalyzer, BehaviorAnalysisResult } from './behaviorAnalyzer';

const prisma = new PrismaClient();

export interface AttendanceRuleConfig {
  requireGPS: boolean;
  requireSelfie: boolean;
  requireWiFi: boolean;
  requireDeviceBinding: boolean;
  allowedCheckInStart: string; // HH:mm
  allowedCheckInEnd: string;   // HH:mm
}

export interface CheckInData {
  employeeId: string;
  locationId: string;
  gps?: GPSCoordinates;
  selfie?: string; // base64
  wifiSSID?: string;
  deviceInfo?: DeviceInfo;
  timestamp: Date;
}

export interface ValidationResult {
  type: string;
  isValid: boolean;
  flags: string[];
  message?: string;
  metadata?: any;
}

export interface FinalValidationResult {
  isValid: boolean;
  validations: ValidationResult[];
  allFlags: string[];
  requiresHRApproval: boolean;
  suspicionLevel: 'low' | 'medium' | 'high';
  canCheckIn: boolean;
  message?: string;
}

export class AttendanceRuleEngine {
  private gpsValidator: GPSValidator;
  private selfieValidator: SelfieValidator;
  private wifiValidator: WiFiValidator;
  private deviceValidator: DeviceValidator;
  private behaviorAnalyzer: BehaviorAnalyzer;

  constructor() {
    this.gpsValidator = new GPSValidator();
    this.selfieValidator = new SelfieValidator();
    this.wifiValidator = new WiFiValidator();
    this.deviceValidator = new DeviceValidator();
    this.behaviorAnalyzer = new BehaviorAnalyzer();
  }

  /**
   * Main validation entry point
   * Evaluates all rules and returns comprehensive validation result
   */
  async validateCheckIn(
    checkInData: CheckInData
  ): Promise<FinalValidationResult> {
    const validations: ValidationResult[] = [];
    const allFlags: string[] = [];
    let overallValid = true;
    let suspicionLevel: 'low' | 'medium' | 'high' = 'low';

    // Get location and rules
    const location = await this.getLocation(checkInData.locationId);
    if (!location) {
      return {
        isValid: false,
        validations: [],
        allFlags: ['LOCATION_NOT_FOUND'],
        requiresHRApproval: true,
        suspicionLevel: 'high',
        canCheckIn: false,
        message: 'Attendance location not found',
      };
    }

    const rules = await this.getRules(checkInData.locationId);

    // 1. GPS Validation
    if (rules.requireGPS) {
      if (!checkInData.gps) {
        validations.push({
          type: 'GPS',
          isValid: false,
          flags: ['GPS_DATA_MISSING'],
          message: 'GPS data is required',
        });
        allFlags.push('GPS_DATA_MISSING');
        overallValid = false;
      } else {
        const lastLocation = await this.getLastLocation(checkInData.employeeId);
        const gpsResult = await this.gpsValidator.validate(
          checkInData.gps,
          location,
          lastLocation || undefined
        );

        validations.push({
          type: 'GPS',
          isValid: gpsResult.isValid,
          flags: gpsResult.flags,
          message: gpsResult.message,
          metadata: { distance: gpsResult.distance },
        });

        if (!gpsResult.isValid) {
          allFlags.push(...gpsResult.flags);
          overallValid = false;
        }
      }
    }

    // 2. Selfie Validation
    if (rules.requireSelfie) {
      if (!checkInData.selfie) {
        validations.push({
          type: 'SELFIE',
          isValid: false,
          flags: ['SELFIE_DATA_MISSING'],
          message: 'Selfie is required',
        });
        allFlags.push('SELFIE_DATA_MISSING');
        overallValid = false;
      } else {
        const recentSelfieHashes = await this.getRecentSelfieHashes(
          checkInData.employeeId,
          30 // last 30 days
        );

        const selfieResult = await this.selfieValidator.validate(
          checkInData.selfie,
          checkInData.employeeId,
          recentSelfieHashes
        );

        validations.push({
          type: 'SELFIE',
          isValid: selfieResult.isValid,
          flags: selfieResult.flags,
          message: selfieResult.message,
          metadata: selfieResult.metadata,
        });

        if (!selfieResult.isValid) {
          allFlags.push(...selfieResult.flags);
          overallValid = false;
        }
      }
    }

    // 3. WiFi Validation
    if (rules.requireWiFi) {
      const allowedSSIDs = location.wifi_ssids as string[] || [];

      const wifiResult = await this.wifiValidator.validate(
        checkInData.wifiSSID || null,
        allowedSSIDs
      );

      validations.push({
        type: 'WIFI',
        isValid: wifiResult.isValid,
        flags: wifiResult.flags,
        message: wifiResult.message,
      });

      if (!wifiResult.isValid) {
        allFlags.push(...wifiResult.flags);
        overallValid = false;
      }
    }

    // 4. Device Binding Validation
    if (rules.requireDeviceBinding) {
      if (!checkInData.deviceInfo) {
        validations.push({
          type: 'DEVICE',
          isValid: false,
          flags: ['DEVICE_INFO_MISSING'],
          message: 'Device information is required',
        });
        allFlags.push('DEVICE_INFO_MISSING');
        overallValid = false;
      } else {
        const deviceResult = await this.deviceValidator.validate(
          checkInData.employeeId,
          checkInData.deviceInfo
        );

        validations.push({
          type: 'DEVICE',
          isValid: deviceResult.isValid,
          flags: deviceResult.flags,
          message: deviceResult.message,
          metadata: {
            isNewDevice: deviceResult.isNewDevice,
            requiresApproval: deviceResult.requiresApproval,
          },
        });

        if (!deviceResult.isValid) {
          allFlags.push(...deviceResult.flags);
          overallValid = false;
        }
      }
    }

    // 5. Time Window Validation
    const timeResult = this.validateTimeWindow(
      checkInData.timestamp,
      rules.allowedCheckInStart,
      rules.allowedCheckInEnd
    );

    validations.push({
      type: 'TIME_WINDOW',
      isValid: timeResult.isValid,
      flags: timeResult.flags,
      message: timeResult.message,
    });

    if (!timeResult.isValid) {
      allFlags.push(...timeResult.flags);
      overallValid = false;
    }

    // 6. Behavior Analysis
    const behaviorResult = await this.behaviorAnalyzer.analyze(
      checkInData.employeeId,
      checkInData.timestamp
    );

    validations.push({
      type: 'BEHAVIOR',
      isValid: behaviorResult.isValid,
      flags: behaviorResult.flags,
      message: behaviorResult.message,
      metadata: { suspicionLevel: behaviorResult.suspicionLevel },
    });

    if (!behaviorResult.isValid) {
      allFlags.push(...behaviorResult.flags);
      // Behavior issues don't block check-in, but flag for review
      suspicionLevel = behaviorResult.suspicionLevel;
    }

    // Determine final status
    const requiresHRApproval = allFlags.length > 0;
    const canCheckIn = overallValid || this.shouldAllowWithFlags(allFlags);

    return {
      isValid: overallValid,
      validations,
      allFlags,
      requiresHRApproval,
      suspicionLevel,
      canCheckIn,
      message: this.generateFinalMessage(overallValid, allFlags, canCheckIn),
    };
  }

  /**
   * Get location by ID
   */
  private async getLocation(locationId: string) {
    return await prisma.attendanceLocation.findUnique({
      where: { id: locationId },
    });
  }

  /**
   * Get attendance rules for location
   */
  private async getRules(locationId: string): Promise<AttendanceRuleConfig> {
    const rule = await prisma.attendanceRule.findFirst({
      where: {
        location_id: locationId,
        is_active: true,
      },
    });

    if (!rule) {
      // Default rules
      return {
        requireGPS: true,
        requireSelfie: true,
        requireWiFi: false,
        requireDeviceBinding: true,
        allowedCheckInStart: '06:00',
        allowedCheckInEnd: '10:00',
      };
    }

    return {
      requireGPS: rule.require_gps,
      requireSelfie: rule.require_selfie,
      requireWiFi: rule.require_wifi,
      requireDeviceBinding: rule.require_device_binding,
      allowedCheckInStart: rule.allowed_check_in_start,
      allowedCheckInEnd: rule.allowed_check_in_end,
    };
  }

  /**
   * Get last GPS location for employee
   */
  private async getLastLocation(employeeId: string) {
    const lastRecord = await prisma.attendanceRecord.findFirst({
      where: { employee_id: employeeId },
      orderBy: { check_in_time: 'desc' },
      select: {
        gps_latitude: true,
        gps_longitude: true,
        check_in_time: true,
      },
    });

    if (!lastRecord) return null;

    return {
      latitude: lastRecord.gps_latitude,
      longitude: lastRecord.gps_longitude,
      timestamp: lastRecord.check_in_time,
    };
  }

  /**
   * Get recent selfie hashes for duplicate detection
   */
  private async getRecentSelfieHashes(
    employeeId: string,
    days: number
  ): Promise<string[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: startDate,
        },
        selfie_hash: {
          not: null,
        },
      },
      select: {
        selfie_hash: true,
      },
    });

    return records
      .map((r) => r.selfie_hash)
      .filter((hash): hash is string => hash !== null);
  }

  /**
   * Validate time window
   */
  private validateTimeWindow(
    timestamp: Date,
    startTime: string,
    endTime: string
  ): ValidationResult {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const checkInHour = timestamp.getHours();
    const checkInMinute = timestamp.getMinutes();

    const checkInMinutes = checkInHour * 60 + checkInMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    const isValid = checkInMinutes >= startMinutes && checkInMinutes <= endMinutes;

    return {
      type: 'TIME_WINDOW',
      isValid,
      flags: isValid ? [] : ['TIME_OUTSIDE_ALLOWED_WINDOW'],
      message: isValid
        ? undefined
        : `Check-in time must be between ${startTime} and ${endTime}`,
    };
  }

  /**
   * Determine if check-in should be allowed despite flags
   * Some flags are warnings, not blockers
   */
  private shouldAllowWithFlags(flags: string[]): boolean {
    // Define blocking flags (that prevent check-in)
    const blockingFlags = [
      'DEVICE_NOT_APPROVED',
      'DEVICE_DEACTIVATED',
      'DEVICE_BELONGS_TO_ANOTHER_EMPLOYEE',
      'TIME_OUTSIDE_ALLOWED_WINDOW',
      'GPS_OUTSIDE_GEOFENCE',
      'WIFI_SSID_NOT_ALLOWED',
    ];

    // If any blocking flag is present, don't allow
    return !flags.some((flag) => blockingFlags.includes(flag));
  }

  /**
   * Generate final message
   */
  private generateFinalMessage(
    isValid: boolean,
    flags: string[],
    canCheckIn: boolean
  ): string {
    if (isValid) {
      return 'Check-in successful';
    }

    if (canCheckIn) {
      return 'Check-in successful, but flagged for HR review';
    }

    return 'Check-in blocked. Please contact HR.';
  }
}
