/**
 * Selfie Validator
 * Anti-spoofing validation for attendance selfies
 */

import crypto from 'crypto';
import sharp from 'sharp';
import { config } from '../../../config';

export interface SelfieValidationResult {
  isValid: boolean;
  flags: string[];
  imageHash: string;
  metadata?: any;
  message?: string;
}

export class SelfieValidator {
  private minWidth: number;
  private minHeight: number;

  constructor() {
    this.minWidth = config.attendance.selfieMinResolution.width; // 480
    this.minHeight = config.attendance.selfieMinResolution.height; // 640
  }

  /**
   * Main selfie validation function
   */
  async validate(
    selfieBase64: string,
    userId: string,
    recentSelfieHashes: string[] = []
  ): Promise<SelfieValidationResult> {
    const flags: string[] = [];

    try {
      // 1. Decode base64 image
      const imageBuffer = this.decodeBase64(selfieBase64);

      if (!imageBuffer) {
        flags.push('SELFIE_INVALID_FORMAT');
        return {
          isValid: false,
          flags,
          imageHash: '',
          message: 'Invalid image format',
        };
      }

      // 2. Extract image metadata
      const metadata = await this.extractMetadata(imageBuffer);

      // 3. Validate image resolution
      if (metadata.width < this.minWidth || metadata.height < this.minHeight) {
        flags.push('SELFIE_LOW_RESOLUTION');
      }

      // 4. Check for camera metadata (EXIF data)
      if (!this.hasCameraMetadata(metadata)) {
        flags.push('SELFIE_NO_CAMERA_METADATA');
      }

      // 5. Calculate image hash
      const imageHash = await this.calculateImageHash(imageBuffer);

      // 6. Check for duplicate images
      if (recentSelfieHashes.includes(imageHash)) {
        flags.push('SELFIE_DUPLICATE_IMAGE');
      }

      // 7. Validate image size (too small might be suspicious)
      if (imageBuffer.length < 10000) {
        // Less than 10KB is suspicious
        flags.push('SELFIE_FILE_TOO_SMALL');
      }

      // 8. Check for edited/filtered images
      if (this.isSuspiciouslyEdited(metadata)) {
        flags.push('SELFIE_SUSPECTED_EDITED');
      }

      // 9. Validate image format
      if (!['jpeg', 'jpg', 'png'].includes(metadata.format?.toLowerCase() || '')) {
        flags.push('SELFIE_INVALID_FORMAT');
      }

      return {
        isValid: flags.length === 0,
        flags,
        imageHash,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: imageBuffer.length,
          hasExif: metadata.exif !== undefined,
        },
        message: flags.length > 0 ? this.formatFlagsMessage(flags) : undefined,
      };
    } catch (error: any) {
      flags.push('SELFIE_PROCESSING_ERROR');
      return {
        isValid: false,
        flags,
        imageHash: '',
        message: `Error processing selfie: ${error.message}`,
      };
    }
  }

  /**
   * Decode base64 image
   */
  private decodeBase64(base64String: string): Buffer | null {
    try {
      // Remove data URI prefix if present
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract image metadata using Sharp
   */
  private async extractMetadata(imageBuffer: Buffer): Promise<any> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      return metadata;
    } catch (error) {
      throw new Error('Failed to extract image metadata');
    }
  }

  /**
   * Check if image has camera metadata (EXIF)
   */
  private hasCameraMetadata(metadata: any): boolean {
    // Check for EXIF data which is typically present in camera photos
    if (metadata.exif) {
      return true;
    }

    // Some phones strip EXIF, so this is a soft check
    // Additional indicators: orientation data, density
    if (metadata.orientation || metadata.density) {
      return true;
    }

    return false;
  }

  /**
   * Calculate perceptual hash of image for duplicate detection
   * Uses a simple average hash algorithm
   */
  private async calculateImageHash(imageBuffer: Buffer): Promise<string> {
    try {
      // Resize to 8x8 and convert to grayscale
      const resized = await sharp(imageBuffer)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();

      // Calculate average pixel value
      let sum = 0;
      for (let i = 0; i < resized.length; i++) {
        sum += resized[i];
      }
      const average = sum / resized.length;

      // Create hash based on pixels above/below average
      let hash = '';
      for (let i = 0; i < resized.length; i++) {
        hash += resized[i] > average ? '1' : '0';
      }

      // Convert binary string to hex
      const hexHash = BigInt('0b' + hash).toString(16).padStart(16, '0');

      // Also include SHA-256 for exact duplicate detection
      const sha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');

      return `${hexHash}-${sha256.substring(0, 16)}`;
    } catch (error) {
      // Fallback to simple SHA-256
      return crypto.createHash('sha256').update(imageBuffer).digest('hex');
    }
  }

  /**
   * Check if image appears to be edited or filtered
   */
  private isSuspiciouslyEdited(metadata: any): boolean {
    // Check for software markers in EXIF
    if (metadata.exif) {
      const exifBuffer = metadata.exif;
      const exifString = exifBuffer.toString();

      // Common photo editing software identifiers
      const editingSoftware = [
        'Photoshop',
        'GIMP',
        'Lightroom',
        'Snapseed',
        'VSCO',
        'Instagram',
      ];

      return editingSoftware.some((software) =>
        exifString.toLowerCase().includes(software.toLowerCase())
      );
    }

    return false;
  }

  /**
   * Compare two image hashes to check similarity
   */
  public compareHashes(hash1: string, hash2: string): number {
    // Extract perceptual hash part (before the dash)
    const phash1 = hash1.split('-')[0];
    const phash2 = hash2.split('-')[0];

    if (!phash1 || !phash2) {
      return 0;
    }

    // Calculate Hamming distance
    let distance = 0;
    const len = Math.min(phash1.length, phash2.length);

    for (let i = 0; i < len; i++) {
      if (phash1[i] !== phash2[i]) {
        distance++;
      }
    }

    // Convert to similarity percentage
    const similarity = ((len - distance) / len) * 100;

    return similarity;
  }

  /**
   * Check if two images are duplicates
   */
  public areDuplicates(hash1: string, hash2: string, threshold: number = 95): boolean {
    const similarity = this.compareHashes(hash1, hash2);
    return similarity >= threshold;
  }

  /**
   * Format flags into human-readable message
   */
  private formatFlagsMessage(flags: string[]): string {
    const messages: { [key: string]: string } = {
      SELFIE_INVALID_FORMAT: 'Image format is invalid',
      SELFIE_LOW_RESOLUTION: 'Image resolution is too low',
      SELFIE_NO_CAMERA_METADATA: 'Missing camera metadata',
      SELFIE_DUPLICATE_IMAGE: 'This image has been used before',
      SELFIE_FILE_TOO_SMALL: 'Image file size is suspiciously small',
      SELFIE_SUSPECTED_EDITED: 'Image appears to be edited',
      SELFIE_PROCESSING_ERROR: 'Error processing image',
    };

    return flags.map((flag) => messages[flag] || flag).join('; ');
  }

  /**
   * Validate that image is a face (basic check)
   * This is a placeholder for more advanced face detection
   */
  async validateFacePresent(imageBuffer: Buffer): Promise<boolean> {
    // TODO: Implement face detection using a library like @vladmandic/face-api
    // For now, return true (assume face is present)
    return true;
  }

  /**
   * Save selfie to disk
   */
  async saveSelfie(
    imageBuffer: Buffer,
    userId: string,
    timestamp: Date
  ): Promise<string> {
    const filename = `${userId}-${timestamp.getTime()}.jpg`;
    const filepath = `${config.upload.storagePath}/selfies/${filename}`;

    // Compress and save as JPEG
    await sharp(imageBuffer)
      .jpeg({ quality: 85 })
      .toFile(filepath);

    return filepath;
  }
}
