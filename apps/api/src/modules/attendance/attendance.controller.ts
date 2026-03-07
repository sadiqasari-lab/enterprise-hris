/**
 * Attendance Controller
 * Handles HTTP requests for attendance endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';
import { ApiError } from '../../middleware/errorHandler';

export class AttendanceController {
  /**
   * POST /api/attendance/check-in
   * Mobile check-in with anti-spoofing
   */
  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { locationId, gps, selfie, wifiSSID, deviceInfo } = req.body;
      const employeeId = req.userId!;

      if (!locationId) {
        throw new ApiError(400, 'Location ID is required');
      }

      const result = await attendanceService.checkIn({
        employeeId,
        locationId,
        gps: gps ? {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          altitude: gps.altitude,
          speed: gps.speed,
          timestamp: new Date(),
        } : undefined,
        selfie,
        wifiSSID,
        deviceInfo,
        timestamp: new Date(),
      });

      const statusCode = result.success ? 200 : 400;

      res.status(statusCode).json({
        success: result.success,
        data: {
          record: result.record,
          validation: result.validation,
        },
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/check-out
   * Check-out employee
   */
  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.userId!;

      const result = await attendanceService.checkOut(
        employeeId,
        new Date()
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/records
   * Get attendance records
   */
  async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.userId!;
      const companyId = req.companyId!;
      const { startDate, endDate, status } = req.query;

      const records = await attendanceService.getAttendanceRecords(
        employeeId,
        companyId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        status as string | undefined
      );

      res.status(200).json({
        success: true,
        data: { records },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/summary
   * Get attendance summary for a month
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.userId!;
      const { month, year } = req.query;

      if (!month || !year) {
        throw new ApiError(400, 'Month and year are required');
      }

      const summary = await attendanceService.getAttendanceSummary(
        employeeId,
        parseInt(month as string, 10),
        parseInt(year as string, 10)
      );

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/flagged
   * Get flagged records (HR Admin only)
   */
  async getFlaggedRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { startDate, endDate } = req.query;

      const records = await attendanceService.getFlaggedRecords(
        companyId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: { records },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/attendance/:id/approve
   * Approve flagged record (HR Admin only)
   */
  async approveFlagged(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const approvedBy = req.userId!;

      const record = await attendanceService.approveFlaggedRecord(
        id,
        approvedBy
      );

      res.status(200).json({
        success: true,
        data: { record },
        message: 'Attendance record approved',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/attendance/:id/reject
   * Reject flagged record (HR Admin only)
   */
  async rejectFlagged(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const rejectedBy = req.userId!;

      if (!reason) {
        throw new ApiError(400, 'Rejection reason is required');
      }

      const record = await attendanceService.rejectFlaggedRecord(
        id,
        rejectedBy,
        reason
      );

      res.status(200).json({
        success: true,
        data: { record },
        message: 'Attendance record rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/:id/request-correction
   * Request correction for attendance record
   */
  async requestCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new ApiError(400, 'Correction reason is required');
      }

      const record = await attendanceService.requestCorrection(id, reason);

      res.status(200).json({
        success: true,
        data: { record },
        message: 'Correction request submitted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
