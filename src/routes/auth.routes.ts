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

const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('otherName').optional().trim(),
  body('age').optional().isInt({ min: 1, max: 150 }).withMessage('Valid age is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('phoneNumber').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).withMessage('Invalid blood group'),
  body('genotype').optional().isIn(['AA', 'AS', 'SS', 'AC', 'SC', 'CC']).withMessage('Invalid genotype'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

// Routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/send-otp', validate(otpValidation), authController.sendOTP);
router.post('/verify-otp', validate(verifyOtpValidation), authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, validate(updateProfileValidation), authController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordValidation), authController.changePassword);

export default router;
