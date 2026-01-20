import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UserRole } from '../types/index.js';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (Doctor or Patient)
 *     description: |
 *       Register a new user account. After successful registration, the user receives an email
 *       containing their unique login ID (DOC_XXX for doctors, PAT_XXX for patients).
 *
 *       **For Doctors:** MDCN number is required and will be verified against the database.
 *       Use `/mdcn/sample-numbers` to get valid test MDCN numbers.
 *
 *       **For Patients:** No MDCN number required.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - age
 *               - email
 *               - phoneNumber
 *               - password
 *               - confirmPassword
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               otherName:
 *                 type: string
 *                 description: User's other/middle name (optional)
 *                 example: "Michael"
 *               age:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 150
 *                 description: User's age in years
 *                 example: 30
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address for receiving login credentials
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "08012345678"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password (minimum 8 characters)
 *                 example: "SecurePass123"
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Must match the password field
 *                 example: "SecurePass123"
 *               role:
 *                 type: string
 *                 enum: [patient, doctor]
 *                 description: User role - determines access permissions
 *                 example: "doctor"
 *               mdcnNumber:
 *                 type: string
 *                 description: |
 *                   Medical and Dental Council of Nigeria number.
 *                   **Required only for doctors**. Will be verified against MDCN database.
 *                 example: "MDCN/2020/12345"
 *           examples:
 *             doctor:
 *               summary: Doctor Registration
 *               value:
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 otherName: "Michael"
 *                 age: 35
 *                 email: "dr.john@hospital.com"
 *                 phoneNumber: "08012345678"
 *                 password: "SecurePass123"
 *                 confirmPassword: "SecurePass123"
 *                 role: "doctor"
 *                 mdcnNumber: "MDCN/2020/12345"
 *             patient:
 *               summary: Patient Registration
 *               value:
 *                 firstName: "Jane"
 *                 lastName: "Smith"
 *                 age: 28
 *                 email: "jane.smith@email.com"
 *                 phoneNumber: "08098765432"
 *                 password: "MyPassword123"
 *                 confirmPassword: "MyPassword123"
 *                 role: "patient"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration successful! A confirmation email with your login ID has been sent to your email address."
 *                 data:
 *                   type: object
 *                   properties:
 *                     uniqueId:
 *                       type: string
 *                       description: Unique login ID (DOC_XXX or PAT_XXX)
 *                       example: "DOC_123"
 *                     email:
 *                       type: string
 *                       example: "dr.john@hospital.com"
 *                     role:
 *                       type: string
 *                       example: "doctor"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: MDCN number not found (for doctors)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists (email or MDCN already registered)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, otherName, age, email, phoneNumber, password, role, mdcnNumber } = req.body;

    const result = await authService.register({
      firstName,
      lastName,
      otherName,
      age: parseInt(age, 10),
      email,
      phoneNumber,
      password,
      role: role as UserRole,
      mdcnNumber
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! A confirmation email with your login ID has been sent to your email address.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with unique ID and password
 *     description: |
 *       Authenticate user with their unique ID and password.
 *       The unique ID is sent to the user's email during registration.
 *
 *       **Returns:** Access token (expires in 24h) and refresh token (expires in 7 days).
 *
 *       **Usage:** Include the access token in the Authorization header for protected routes:
 *       `Authorization: Bearer <access_token>`
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uniqueId
 *               - password
 *             properties:
 *               uniqueId:
 *                 type: string
 *                 description: |
 *                   User's unique ID received via email after registration.
 *                   Format: DOC_XXX for doctors, PAT_XXX for patients
 *                 example: "DOC_123"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "SecurePass123"
 *           example:
 *             uniqueId: "DOC_123"
 *             password: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token (expires in 24h)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token for obtaining new access tokens (expires in 7 days)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         uniqueId:
 *                           type: string
 *                           example: "DOC_123"
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [patient, doctor]
 *                         hospitalName:
 *                           type: string
 *                           description: Only for doctors
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid credentials"
 *               code: "UNAUTHORIZED"
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { uniqueId, password } = req.body;

    const result = await authService.login(uniqueId, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "08012345678"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
export async function sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phoneNumber } = req.body;

    const result = await authService.sendOTP(phoneNumber);

    res.json({
      success: true,
      message: result.message,
      data: { expiresIn: result.expiresIn }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
export async function verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phoneNumber, otp } = req.body;

    await authService.verifyOTP(phoneNumber, otp);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Get a new access token using a valid refresh token.
 *       Use this when your access token has expired.
 *
 *       **When to use:** When you receive a 401 error with code "TOKEN_EXPIRED"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: New refresh token
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: |
 *       Get the profile of the currently authenticated user.
 *       Requires a valid access token in the Authorization header.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     uniqueId:
 *                       type: string
 *                       example: "DOC_123"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     otherName:
 *                       type: string
 *                       example: "Michael"
 *                     age:
 *                       type: integer
 *                       example: 35
 *                     email:
 *                       type: string
 *                       example: "dr.john@hospital.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "08012345678"
 *                     role:
 *                       type: string
 *                       enum: [patient, doctor]
 *                       example: "doctor"
 *                     hospitalName:
 *                       type: string
 *                       description: Only present for doctors
 *                       example: "Lagos University Teaching Hospital"
 *                     mdcnNumber:
 *                       type: string
 *                       description: Only present for doctors
 *                       example: "MDCN/2020/12345"
 *                     isVerified:
 *                       type: boolean
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await authService.getUserById(userId);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: |
 *       Update the logged-in user's profile information.
 *       Can update personal details, health information, and profile picture.
 *       
 *       **All fields are optional** - only send the fields you want to update.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               otherName:
 *                 type: string
 *                 example: "Michael"
 *               age:
 *                 type: integer
 *                 example: 30
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *               phoneNumber:
 *                 type: string
 *                 example: "08012345678"
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, O+, O-, AB+, AB-]
 *                 example: "O+"
 *               genotype:
 *                 type: string
 *                 enum: [AA, AS, SS, AC, SC, CC]
 *                 example: "AA"
 *               height:
 *                 type: number
 *                 description: Height in centimeters
 *                 example: 175
 *               weight:
 *                 type: number
 *                 description: Weight in kilograms
 *                 example: 70
 *               profilePicture:
 *                 type: string
 *                 description: URL to profile picture
 *                 example: "https://storage.example.com/profiles/user123.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized - No token or invalid token
 *       409:
 *         description: Conflict - Phone number already in use
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updates = req.body;

    // Convert dateOfBirth string to Date if provided
    if (updates.dateOfBirth) {
      updates.dateOfBirth = new Date(updates.dateOfBirth);
    }

    const updatedUser = await authService.updateProfile(userId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: |
 *       Change the password for the logged-in user.
 *       Requires the current password for verification.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *                 example: "OldPass123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *                 example: "NewPass456"
 *               confirmPassword:
 *                 type: string
 *                 description: Must match newPassword
 *                 example: "NewPass456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Bad request - Passwords don't match or invalid format
 *       401:
 *         description: Unauthorized - Current password is incorrect
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
}
