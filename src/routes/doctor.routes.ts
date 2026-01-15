import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as doctorController from '../controllers/doctor.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createDoctorValidation = [
  body('hospitalId').notEmpty().withMessage('Hospital ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

const updateDoctorValidation = [
  body('availability').optional().isIn(['available', 'busy', 'on_leave', 'offline']).withMessage('Invalid availability'),
  body('maxPatients').optional().isInt({ min: 1 }).withMessage('Max patients must be a positive integer')
];

const referralValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('reason').notEmpty().withMessage('Referral reason is required'),
  body('urgency').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level')
];

// Routes
router.post('/', authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), validate(createDoctorValidation), doctorController.createDoctor);

router.get('/me', authorize(UserRole.DOCTOR), doctorController.getMyProfile);

router.get('/referrals/pending', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), doctorController.getPendingReferrals);

router.get('/hospital/:hospitalId', doctorController.getDoctorsByHospital);

router.get('/hospital/:hospitalId/available', doctorController.getAvailableDoctors);

router.get('/:id', doctorController.getDoctorById);

router.patch('/:id', authorize(UserRole.DOCTOR, UserRole.ADMIN), validate(updateDoctorValidation), doctorController.updateDoctor);

router.patch('/:id/availability', authorize(UserRole.DOCTOR), doctorController.setAvailability);

router.get('/:id/patients', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), doctorController.getDoctorPatients);

router.get('/:id/stats', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), doctorController.getDoctorStats);

router.post('/:id/refer', authorize(UserRole.DOCTOR), validate(referralValidation), doctorController.referPatient);

router.post('/:id/referrals/accept/:referralId', authorize(UserRole.DOCTOR), doctorController.acceptReferral);

export default router;
