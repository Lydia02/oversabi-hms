import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { config } from '../config/index.js';

/**
 * Safely get a string from params/query (Express 5 compatibility)
 * Returns empty string if undefined
 */
export function getString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return '';
}

/**
 * Safely get an optional string from query parameter
 */
export function getOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

/**
 * Generate a unique Health ID
 * Format: OSB-XXXXXXXX (where X is alphanumeric)
 */
export function generateHealthId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${config.healthId.prefix}-${id}`;
}

/**
 * Generate a unique Medical Identification Number (MIN)
 * Format: MIN-XXXXXXXXXX (where X is numeric, 10 digits like phone number format)
 */
export function generateMIN(): string {
  const numbers = '0123456789';
  let min = '';
  for (let i = 0; i < 10; i++) {
    min += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return min;
}

/**
 * Generate a QR code containing the Health ID
 */
export async function generateQRCode(healthId: string): Promise<string> {
  try {
    const qrData = JSON.stringify({
      type: 'oversabi_health_id',
      healthId,
      version: '1.0'
    });
    return await QRCode.toDataURL(qrData);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a unique user ID based on role
 * Format: DOC_XXX for doctors, PAT_XXX for patients
 */
export function generateUserUniqueId(role: 'doctor' | 'patient'): string {
  const prefix = role === 'doctor' ? 'DOC' : 'PAT';
  const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number (100-999)
  return `${prefix}_${randomNum}`;
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Nigerian phone numbers
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  } else if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }

  return '+' + cleaned;
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Nigerian numbers: 234XXXXXXXXXX (13 digits) or 0XXXXXXXXXX (11 digits)
  return /^(234|0)[789][01]\d{8}$/.test(cleaned);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, showLast = 4): string {
  if (data.length <= showLast) return '*'.repeat(data.length);
  return '*'.repeat(data.length - showLast) + data.slice(-showLast);
}

/**
 * Parse pagination parameters
 */
export function parsePagination(page?: string | number, limit?: string | number): { page: number; limit: number; offset: number } {
  const parsedPage = Math.max(1, parseInt(String(page || '1'), 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || '10'), 10)));
  const offset = (parsedPage - 1) * parsedLimit;

  return { page: parsedPage, limit: parsedLimit, offset };
}
