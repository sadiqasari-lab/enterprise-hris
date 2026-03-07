/**
 * Configuration Management
 * Centralized configuration for the HRIS API
 */

import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  cors: {
    origin: string | string[];
  };
  upload: {
    maxFileSize: number;
    allowedFileTypes: string[];
    storagePath: string;
  };
  attendance: {
    gpsAccuracyThreshold: number; // meters
    maxLocationJumpDistance: number; // meters
    minLocationJumpTime: number; // milliseconds
    selfieMinResolution: { width: number; height: number };
  };
  encryption: {
    algorithm: string;
    key: string;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'change-this-secret-in-production',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'change-this-secret-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedFileTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    storagePath: process.env.UPLOAD_PATH || './uploads',
  },
  
  attendance: {
    gpsAccuracyThreshold: parseInt(process.env.GPS_ACCURACY_THRESHOLD || '50', 10),
    maxLocationJumpDistance: parseInt(process.env.MAX_LOCATION_JUMP_DISTANCE || '100000', 10), // 100km
    minLocationJumpTime: parseInt(process.env.MIN_LOCATION_JUMP_TIME || '600000', 10), // 10 minutes
    selfieMinResolution: {
      width: parseInt(process.env.SELFIE_MIN_WIDTH || '480', 10),
      height: parseInt(process.env.SELFIE_MIN_HEIGHT || '640', 10),
    },
  },
  
  encryption: {
    algorithm: 'aes-256-cbc',
    key: process.env.ENCRYPTION_KEY || 'change-this-32-character-secret!',
  },
};

// Validation
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0 && config.env === 'production') {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
