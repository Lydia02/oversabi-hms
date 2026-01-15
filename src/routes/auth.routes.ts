import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['patient', 'doctor', 'pharmacist', 'lab_technician', 'admin', 'hospital_admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const otpValidation = [
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
];

const verifyOtpValidation = [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/send-otp', validate(otpValidation), authController.sendOTP);
router.post('/verify-otp', validate(verifyOtpValidation), authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
