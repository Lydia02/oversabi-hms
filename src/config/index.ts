import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || ''
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },

  // OTP
  otp: {
    expiry: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10), // minutes
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10)
  },

  // Health ID
  healthId: {
    prefix: process.env.HEALTH_ID_PREFIX || 'OSB'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};

export default config;
