import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { collections } from '../config/firebase.js';
import { config } from '../config/index.js';
import {
  User,
  UserRole,
  TokenPayload,
  AuthTokens,
  OTPVerification
} from '../types/index.js';
import {
  generateId,
  generateOTP,
  formatPhoneNumber
} from '../utils/helpers.js';
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError
} from '../utils/errors.js';

export class AuthService {
  /**
   * Register a new user
   */
  async register(
    email: string,
    phoneNumber: string,
    password: string,
    role: UserRole
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Check if user already exists
    const existingByEmail = await collections.users
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingByEmail.empty) {
      throw new ConflictError('Email already registered');
    }

    const existingByPhone = await collections.users
      .where('phoneNumber', '==', formattedPhone)
      .limit(1)
      .get();

    if (!existingByPhone.empty) {
      throw new ConflictError('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const now = new Date();
    const userId = generateId();

    const user: User = {
      id: userId,
      email,
      phoneNumber: formattedPhone,
      passwordHash,
      role,
      isVerified: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await collections.users.doc(userId).set(user);

    const tokens = this.generateTokens({ userId, role });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const snapshot = await collections.users
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as User;

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = this.generateTokens({ userId: user.id, role: user.role });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<{ message: string; expiresIn: number }> {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + config.otp.expiry * 60 * 1000);

    const otpDoc: OTPVerification = {
      phoneNumber: formattedPhone,
      otp,
      expiresAt,
      attempts: 0,
      verified: false
    };

    // Store OTP (use phone as doc ID for easy lookup)
    const docId = formattedPhone.replace(/\+/g, '');
    await collections.otpVerifications.doc(docId).set(otpDoc);

    // TODO: Integrate with SMS provider (e.g., Termii, Africa's Talking)
    // For development, log the OTP
    console.log(`OTP for ${formattedPhone}: ${otp}`);

    return {
      message: 'OTP sent successfully',
      expiresIn: config.otp.expiry * 60 // in seconds
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const docId = formattedPhone.replace(/\+/g, '');

    const otpDoc = await collections.otpVerifications.doc(docId).get();

    if (!otpDoc.exists) {
      throw new BadRequestError('OTP not found. Please request a new one.');
    }

    const otpData = otpDoc.data() as OTPVerification;

    if (otpData.verified) {
      throw new BadRequestError('OTP already used');
    }

    if (new Date() > new Date(otpData.expiresAt)) {
      throw new BadRequestError('OTP expired');
    }

    if (otpData.attempts >= config.otp.maxAttempts) {
      throw new BadRequestError('Too many attempts. Please request a new OTP.');
    }

    if (otpData.otp !== otp) {
      // Increment attempts
      await collections.otpVerifications.doc(docId).set({
        attempts: otpData.attempts + 1
      }, { merge: true });
      throw new BadRequestError('Invalid OTP');
    }

    // Mark as verified
    await collections.otpVerifications.doc(docId).set({ verified: true }, { merge: true });

    return true;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as TokenPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const userDoc = await collections.users.doc(decoded.userId).get();

      if (!userDoc.exists) {
        throw new NotFoundError('User not found');
      }

      const user = userDoc.data() as User;

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      return this.generateTokens({ userId: user.id, role: user.role });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: { userId: string; role: UserRole; healthId?: string }): AuthTokens {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.accessTokenExpiry as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshTokenExpiry as jwt.SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const user = userDoc.data() as User;
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
