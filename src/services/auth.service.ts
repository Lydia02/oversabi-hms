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
  formatPhoneNumber,
  generateUserUniqueId
} from '../utils/helpers.js';
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError
} from '../utils/errors.js';
import { emailService } from './email.service.js';
import { mdcnService } from './mdcn.service.js';

interface RegisterData {
  firstName: string;
  lastName: string;
  otherName?: string;
  age: number;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  mdcnNumber?: string;
}

export class AuthService {
  /**
   * Generate a unique user ID that doesn't exist in the database
   */
  private async generateUniqueUserId(role: 'doctor' | 'patient'): Promise<string> {
    let uniqueId: string;
    let exists = true;

    while (exists) {
      uniqueId = generateUserUniqueId(role);
      const existingUser = await collections.users
        .where('uniqueId', '==', uniqueId)
        .limit(1)
        .get();
      exists = !existingUser.empty;
    }

    return uniqueId!;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const { firstName, lastName, otherName, age, email, phoneNumber, password, role, mdcnNumber } = data;
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Validate role is either doctor or patient
    if (role !== UserRole.DOCTOR && role !== UserRole.PATIENT) {
      throw new BadRequestError('Role must be either doctor or patient');
    }

    // Validate and verify MDCN number for doctors
    let hospitalName: string | undefined;
    if (role === UserRole.DOCTOR) {
      if (!mdcnNumber) {
        throw new BadRequestError('MDCN Number is required for doctors');
      }

      // Verify MDCN exists in our database
      const mdcnRecord = await mdcnService.verifyMDCN(mdcnNumber);
      hospitalName = mdcnRecord.hospitalName;

      // Check if MDCN is already registered to another user
      const existingByMDCN = await collections.users
        .where('mdcnNumber', '==', mdcnNumber.toUpperCase())
        .limit(1)
        .get();

      if (!existingByMDCN.empty) {
        throw new ConflictError('This MDCN number is already registered to another account');
      }
    }

    // Check if user already exists by email
    const existingByEmail = await collections.users
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingByEmail.empty) {
      throw new ConflictError('Email already registered');
    }

    // Check if user already exists by phone
    const existingByPhone = await collections.users
      .where('phoneNumber', '==', formattedPhone)
      .limit(1)
      .get();

    if (!existingByPhone.empty) {
      throw new ConflictError('Phone number already registered');
    }

    // Generate unique user ID (DOC_XXX or PAT_XXX)
    const uniqueId = await this.generateUniqueUserId(role === UserRole.DOCTOR ? 'doctor' : 'patient');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const now = new Date();
    const userId = generateId();

    const user: User = {
      id: userId,
      uniqueId,
      firstName,
      lastName,
      otherName,
      age,
      email,
      phoneNumber: formattedPhone,
      passwordHash,
      role,
      mdcnNumber: role === UserRole.DOCTOR ? mdcnNumber?.toUpperCase() : undefined,
      hospitalName: role === UserRole.DOCTOR ? hospitalName : undefined,
      isVerified: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await collections.users.doc(userId).set(user);

    // Mark MDCN as used for doctors
    if (role === UserRole.DOCTOR && mdcnNumber) {
      await mdcnService.markMDCNAsUsed(mdcnNumber, userId, `${firstName} ${lastName}`);
    }

    // Send registration email with unique ID
    await emailService.sendRegistrationEmail({
      firstName,
      lastName,
      uniqueId,
      role: role === UserRole.DOCTOR ? 'doctor' : 'patient',
      email
    });

    const tokens = this.generateTokens({ userId, role });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login with unique ID and password
   */
  async login(uniqueId: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const snapshot = await collections.users
      .where('uniqueId', '==', uniqueId)
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

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      otherName: string;
      age: number;
      dateOfBirth: Date;
      phoneNumber: string;
      bloodGroup: string;
      genotype: string;
      height: number;
      weight: number;
      profilePicture: string;
    }>
  ): Promise<Omit<User, 'passwordHash'>> {
    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new NotFoundError('User not found');
    }

    const user = userDoc.data() as User;

    // Validate phone number if being updated
    if (updates.phoneNumber) {
      const formattedPhone = formatPhoneNumber(updates.phoneNumber);
      
      // Check if phone number is already taken by another user
      const existingByPhone = await collections.users
        .where('phoneNumber', '==', formattedPhone)
        .limit(1)
        .get();

      if (!existingByPhone.empty && existingByPhone.docs[0].id !== userId) {
        throw new ConflictError('Phone number already in use');
      }

      updates.phoneNumber = formattedPhone;
    }

    // Update user document
    await collections.users.doc(userId).set({
      ...updates,
      updatedAt: new Date()
    }, { merge: true });

    // Get updated user
    const updatedUserDoc = await collections.users.doc(userId).get();
    const updatedUser = updatedUserDoc.data() as User;
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new NotFoundError('User not found');
    }

    const user = userDoc.data() as User;

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await collections.users.doc(userId).set({
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    }, { merge: true });
  }
}

export const authService = new AuthService();
