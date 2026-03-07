/**
 * GPS Validator
 * Anti-spoofing validation for GPS coordinates
 */

import { config } from '../../../config';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  timestamp: Date;
}

export interface GPSValidationResult {
  isValid: boolean;
  flags: string[];
  distance?: number; // meters from office
  message?: string;
}

export interface AttendanceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface LastLocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export class GPSValidator {
  private accuracyThreshold: number;
  private maxLocationJumpDistance: number;
  private minLocationJumpTime: number;

  constructor() {
    this.accuracyThreshold = config.attendance.gpsAccuracyThreshold; // 50 meters
    this.maxLocationJumpDistance = config.attendance.maxLocationJumpDistance; // 100km
    this.minLocationJumpTime = config.attendance.minLocationJumpTime; // 10 minutes
  }

  /**
   * Main GPS validation function
   */
  async validate(
    gps: GPSCoordinates,
    location: AttendanceLocation,
    lastLocation?: LastLocationData
  ): Promise<GPSValidationResult> {
    const flags: string[] = [];

    // 1. Check GPS accuracy
    if (gps.accuracy > this.accuracyThreshold) {
      flags.push('GPS_LOW_ACCURACY');
    }

    // 2. Calculate distance from office
    const distance = this.calculateDistance(
      gps.latitude,
      gps.longitude,
      location.latitude,
      location.longitude
    );

    // 3. Check geofence
    if (distance > location.radius_meters) {
      flags.push('GPS_OUTSIDE_GEOFENCE');
    }

    // 4. Check for abnormal location jumps (teleportation detection)
    if (lastLocation) {
      const jumpCheck = this.checkAbnormalJump(gps, lastLocation);
      if (!jumpCheck.isValid) {
        flags.push('GPS_ABNORMAL_JUMP');
      }
    }

    // 5. Validate coordinates are realistic
    if (!this.areValidCoordinates(gps.latitude, gps.longitude)) {
      flags.push('GPS_INVALID_COORDINATES');
    }

    // 6. Check for mock GPS (basic heuristics)
    if (this.isSuspiciousMockGPS(gps)) {
      flags.push('GPS_SUSPECTED_MOCK');
    }

    return {
      isValid: flags.length === 0,
      flags,
      distance,
      message: flags.length > 0 ? this.formatFlagsMessage(flags) : undefined,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check for abnormal location jumps (teleportation)
   */
  private checkAbnormalJump(
    currentGPS: GPSCoordinates,
    lastLocation: LastLocationData
  ): { isValid: boolean; distance: number; timeDiff: number } {
    const distance = this.calculateDistance(
      currentGPS.latitude,
      currentGPS.longitude,
      lastLocation.latitude,
      lastLocation.longitude
    );

    const timeDiff = currentGPS.timestamp.getTime() - lastLocation.timestamp.getTime();

    // If moved more than maxLocationJumpDistance in less than minLocationJumpTime, flag it
    if (distance > this.maxLocationJumpDistance && timeDiff < this.minLocationJumpTime) {
      return { isValid: false, distance, timeDiff };
    }

    return { isValid: true, distance, timeDiff };
  }

  /**
   * Validate that coordinates are within valid ranges
   */
  private areValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude !== 0 &&
      longitude !== 0 // Exact 0,0 is suspicious
    );
  }

  /**
   * Detect suspected mock GPS based on heuristics
   */
  private isSuspiciousMockGPS(gps: GPSCoordinates): boolean {
    const flags: boolean[] = [];

    // 1. Perfect accuracy is suspicious (mocked GPS often returns 0 or very low accuracy)
    if (gps.accuracy < 5) {
      flags.push(true);
    }

    // 2. Missing altitude data can be suspicious for outdoor locations
    if (!gps.altitude && gps.accuracy < 20) {
      flags.push(true);
    }

    // 3. Zero speed while supposedly moving is suspicious
    if (gps.speed !== undefined && gps.speed === 0 && gps.accuracy < 10) {
      flags.push(true);
    }

    // If multiple suspicious indicators, flag it
    return flags.filter(Boolean).length >= 2;
  }

  /**
   * Format flags into human-readable message
   */
  private formatFlagsMessage(flags: string[]): string {
    const messages: { [key: string]: string } = {
      GPS_LOW_ACCURACY: 'GPS signal accuracy is too low',
      GPS_OUTSIDE_GEOFENCE: 'Location is outside the allowed area',
      GPS_ABNORMAL_JUMP: 'Detected abnormal location change',
      GPS_INVALID_COORDINATES: 'GPS coordinates are invalid',
      GPS_SUSPECTED_MOCK: 'Suspected fake GPS location',
    };

    return flags.map((flag) => messages[flag] || flag).join('; ');
  }

  /**
   * Get geofence status
   */
  getGeofenceStatus(
    gps: GPSCoordinates,
    location: AttendanceLocation
  ): {
    isInside: boolean;
    distance: number;
    distanceFromEdge: number;
  } {
    const distance = this.calculateDistance(
      gps.latitude,
      gps.longitude,
      location.latitude,
      location.longitude
    );

    const isInside = distance <= location.radius_meters;
    const distanceFromEdge = location.radius_meters - distance;

    return {
      isInside,
      distance,
      distanceFromEdge,
    };
  }
}
