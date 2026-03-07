/**
 * Behavior Analyzer
 * Detects suspicious attendance patterns and behaviors
 */

import { PrismaClient } from '@hris/database';

const prisma = new PrismaClient();

export interface BehaviorAnalysisResult {
  isValid: boolean;
  flags: string[];
  suspicionLevel: 'low' | 'medium' | 'high';
  message?: string;
}

export class BehaviorAnalyzer {
  /**
   * Analyze attendance behavior for suspicious patterns
   */
  async analyze(
    employeeId: string,
    currentCheckIn: Date
  ): Promise<BehaviorAnalysisResult> {
    const flags: string[] = [];
    let suspicionLevel: 'low' | 'medium' | 'high' = 'low';

    // 1. Check for rapid repeated check-ins (rate limiting)
    const rapidCheckIn = await this.checkRapidCheckIns(employeeId, currentCheckIn);
    if (!rapidCheckIn.isValid) {
      flags.push('BEHAVIOR_RAPID_CHECKINS');
      suspicionLevel = 'high';
    }

    // 2. Check for unusual time patterns
    const timePattern = await this.checkTimePatterns(employeeId, currentCheckIn);
    if (!timePattern.isValid) {
      flags.push('BEHAVIOR_UNUSUAL_TIME_PATTERN');
      suspicionLevel = this.elevateLevel(suspicionLevel, 'medium');
    }

    // 3. Check for consecutive flagged entries
    const consecutiveFlags = await this.checkConsecutiveFlaggedEntries(employeeId);
    if (!consecutiveFlags.isValid) {
      flags.push('BEHAVIOR_REPEATED_FLAGS');
      suspicionLevel = this.elevateLevel(suspicionLevel, 'high');
    }

    // 4. Check for weekend/holiday check-ins (if unusual for employee)
    const weekendPattern = await this.checkWeekendPattern(employeeId, currentCheckIn);
    if (!weekendPattern.isValid) {
      flags.push('BEHAVIOR_UNUSUAL_WEEKEND_CHECKIN');
      suspicionLevel = this.elevateLevel(suspicionLevel, 'medium');
    }

    // 5. Check for missing check-outs
    const missingCheckouts = await this.checkMissingCheckouts(employeeId);
    if (!missingCheckouts.isValid) {
      flags.push('BEHAVIOR_FREQUENT_MISSING_CHECKOUTS');
      suspicionLevel = this.elevateLevel(suspicionLevel, 'medium');
    }

    return {
      isValid: flags.length === 0,
      flags,
      suspicionLevel,
      message: flags.length > 0 ? this.formatFlagsMessage(flags) : undefined,
    };
  }

  /**
   * Check for rapid repeated check-ins (within 5 minutes)
   */
  private async checkRapidCheckIns(
    employeeId: string,
    currentCheckIn: Date
  ): Promise<{ isValid: boolean }> {
    const fiveMinutesAgo = new Date(currentCheckIn.getTime() - 5 * 60 * 1000);

    const recentCheckIn = await prisma.attendanceRecord.findFirst({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: fiveMinutesAgo,
        },
      },
    });

    return { isValid: !recentCheckIn };
  }

  /**
   * Check for unusual time patterns
   */
  private async checkTimePatterns(
    employeeId: string,
    currentCheckIn: Date
  ): Promise<{ isValid: boolean }> {
    // Get employee's typical check-in time over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await prisma.attendanceRecord.findMany({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: thirtyDaysAgo,
        },
        status: 'VALID',
      },
      select: {
        check_in_time: true,
      },
    });

    if (recentRecords.length < 5) {
      // Not enough data to establish pattern
      return { isValid: true };
    }

    // Calculate average check-in hour
    const hours = recentRecords.map((r) => r.check_in_time.getHours());
    const avgHour = hours.reduce((sum, h) => sum + h, 0) / hours.length;

    // Check if current check-in is more than 3 hours off from average
    const currentHour = currentCheckIn.getHours();
    const hourDifference = Math.abs(currentHour - avgHour);

    // If difference is > 3 hours, flag as unusual
    return { isValid: hourDifference <= 3 };
  }

  /**
   * Check for consecutive flagged entries
   */
  private async checkConsecutiveFlaggedEntries(
    employeeId: string
  ): Promise<{ isValid: boolean }> {
    const lastFiveRecords = await prisma.attendanceRecord.findMany({
      where: { employee_id: employeeId },
      orderBy: { check_in_time: 'desc' },
      take: 5,
      select: {
        flags: true,
      },
    });

    // Count how many of the last 5 have flags
    const flaggedCount = lastFiveRecords.filter(
      (record) => record.flags.length > 0
    ).length;

    // If more than 3 out of 5 are flagged, suspicious
    return { isValid: flaggedCount <= 3 };
  }

  /**
   * Check for unusual weekend check-ins
   */
  private async checkWeekendPattern(
    employeeId: string,
    currentCheckIn: Date
  ): Promise<{ isValid: boolean }> {
    const dayOfWeek = currentCheckIn.getDay(); // 0 = Sunday, 6 = Saturday

    // If not weekend, return valid
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      return { isValid: true };
    }

    // Check employee's weekend work pattern over last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const weekendRecords = await prisma.attendanceRecord.count({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: ninetyDaysAgo,
        },
      },
    });

    // If employee rarely works weekends (less than 10% of time), flag it
    const totalDays = 90;
    const weekendPercentage = (weekendRecords / totalDays) * 100;

    return { isValid: weekendPercentage >= 10 };
  }

  /**
   * Check for frequent missing check-outs
   */
  private async checkMissingCheckouts(
    employeeId: string
  ): Promise<{ isValid: boolean }> {
    const lastTenRecords = await prisma.attendanceRecord.findMany({
      where: { employee_id: employeeId },
      orderBy: { check_in_time: 'desc' },
      take: 10,
      select: {
        check_out_time: true,
      },
    });

    if (lastTenRecords.length < 5) {
      return { isValid: true };
    }

    // Count missing check-outs
    const missingCheckouts = lastTenRecords.filter(
      (record) => !record.check_out_time
    ).length;

    // If more than 50% are missing check-outs, flag it
    return { isValid: missingCheckouts / lastTenRecords.length <= 0.5 };
  }

  /**
   * Elevate suspicion level
   */
  private elevateLevel(
    current: 'low' | 'medium' | 'high',
    proposed: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    const levels = { low: 1, medium: 2, high: 3 };
    return levels[proposed] > levels[current] ? proposed : current;
  }

  /**
   * Format flags into human-readable message
   */
  private formatFlagsMessage(flags: string[]): string {
    const messages: { [key: string]: string } = {
      BEHAVIOR_RAPID_CHECKINS: 'Multiple check-ins in short time',
      BEHAVIOR_UNUSUAL_TIME_PATTERN: 'Unusual check-in time',
      BEHAVIOR_REPEATED_FLAGS: 'Multiple flagged entries detected',
      BEHAVIOR_UNUSUAL_WEEKEND_CHECKIN: 'Unusual weekend check-in',
      BEHAVIOR_FREQUENT_MISSING_CHECKOUTS: 'Frequently missing check-outs',
    };

    return flags.map((flag) => messages[flag] || flag).join('; ');
  }

  /**
   * Get employee attendance statistics
   */
  async getStatistics(employeeId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employee_id: employeeId,
        check_in_time: {
          gte: startDate,
        },
      },
    });

    const flaggedRecords = records.filter((r) => r.flags.length > 0);
    const missingCheckouts = records.filter((r) => !r.check_out_time);

    return {
      totalRecords: records.length,
      flaggedRecords: flaggedRecords.length,
      flaggedPercentage: (flaggedRecords.length / records.length) * 100,
      missingCheckouts: missingCheckouts.length,
      averageCheckInTime: this.calculateAverageCheckInTime(records),
    };
  }

  /**
   * Calculate average check-in time
   */
  private calculateAverageCheckInTime(records: any[]): string {
    if (records.length === 0) return 'N/A';

    const totalMinutes = records.reduce((sum, record) => {
      const date = new Date(record.check_in_time);
      return sum + date.getHours() * 60 + date.getMinutes();
    }, 0);

    const avgMinutes = Math.round(totalMinutes / records.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
