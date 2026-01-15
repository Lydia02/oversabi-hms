import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as patientController from '../controllers/patient.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createPatientValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
];

const updatePatientValidation = [
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).withMessage('Invalid blood type'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('chronicConditions').optional().isArray().withMessage('Chronic conditions must be an array')
];

const searchValidation = [
  query('q').notEmpty().withMessage('Search query is required')
];

// Routes
router.post('/', validate(createPatientValidation), patientController.createPatient);

router.get('/me', authorize(UserRole.PATIENT), patientController.getMyProfile);

router.get('/search', authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), validate(searchValidation), patientController.searchPatients);

router.get('/health-id/:healthId', patientController.getPatientByHealthId);

router.get('/phone/:phoneNumber', authorize(UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.ADMIN), patientController.getPatientByPhone);

router.get('/emergency/:healthId', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), patientController.getEmergencyProfile);

router.get('/', authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), patientController.getAllPatients);

router.get('/:id', patientController.getPatientById);

router.patch('/:id', validate(updatePatientValidation), patientController.updatePatient);

router.get('/:id/visits', patientController.getPatientVisits);

router.get('/:id/prescriptions', patientController.getPatientPrescriptions);

router.get('/:id/lab-tests', patientController.getPatientLabTests);

router.post('/:id/regenerate-qr', authorize(UserRole.PATIENT, UserRole.ADMIN), patientController.regenerateQRCode);

export default router;
