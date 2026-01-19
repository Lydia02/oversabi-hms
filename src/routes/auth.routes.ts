import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('otherName').optional().trim(),
  body('age').isInt({ min: 1, max: 150 }).withMessage('Valid age is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('role').isIn(['patient', 'doctor']).withMessage('Role must be either patient or doctor'),
  body('mdcnNumber').custom((value, { req }) => {
    if (req.body.role === 'doctor' && !value) {
      throw new Error('MDCN Number is required for doctors');
    }
    return true;
  })
];

const loginValidation = [
  body('uniqueId').notEmpty().withMessage('User ID is required'),
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
