import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as labController from '../controllers/lab.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createLabCenterValidation = [
  body('name').notEmpty().withMessage('Lab center name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.country').notEmpty().withMessage('Country is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('servicesOffered').isArray({ min: 1 }).withMessage('At least one service must be offered')
];

const createLabTechnicianValidation = [
  body('labCenterId').notEmpty().withMessage('Lab center ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required')
];

const createLabTestValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('orderedBy').notEmpty().withMessage('Ordering doctor ID is required'),
  body('testType').notEmpty().withMessage('Test type is required'),
  body('testName').notEmpty().withMessage('Test name is required')
];

const completeLabTestValidation = [
  body('values').notEmpty().withMessage('Test result values are required'),
  body('verifiedBy').notEmpty().withMessage('Verifying technician ID is required')
];

const assignLabTestValidation = [
  body('labCenterId').notEmpty().withMessage('Lab center ID is required')
];

// Routes

// Lab Center management
router.post('/centers', authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), validate(createLabCenterValidation), labController.createLabCenter);

router.get('/centers', labController.getLabCenters);

router.get('/centers/:id', labController.getLabCenterById);

router.get('/centers/:id/stats', authorize(UserRole.LAB_TECHNICIAN, UserRole.ADMIN), labController.getLabCenterStats);

router.get('/centers/:labCenterId/technicians', labController.getLabTechniciansByCenter);

router.get('/centers/:labCenterId/tests/pending', authorize(UserRole.LAB_TECHNICIAN), labController.getPendingLabTests);

// Lab Technician routes
router.post('/technicians', authorize(UserRole.LAB_TECHNICIAN, UserRole.ADMIN), validate(createLabTechnicianValidation), labController.createLabTechnician);

router.get('/technicians/me', authorize(UserRole.LAB_TECHNICIAN), labController.getMyProfile);

// Lab Test routes
router.post('/tests', authorize(UserRole.DOCTOR), validate(createLabTestValidation), labController.createLabTest);

router.get('/tests/:id', authorize(UserRole.DOCTOR, UserRole.LAB_TECHNICIAN, UserRole.PATIENT), labController.getLabTestById);

router.post('/tests/:id/collect-sample', authorize(UserRole.LAB_TECHNICIAN), labController.collectSample);

router.post('/tests/:id/start-processing', authorize(UserRole.LAB_TECHNICIAN), labController.startProcessing);

router.post('/tests/:id/complete', authorize(UserRole.LAB_TECHNICIAN), validate(completeLabTestValidation), labController.completeLabTest);

router.post('/tests/:id/cancel', authorize(UserRole.DOCTOR, UserRole.LAB_TECHNICIAN), labController.cancelLabTest);

router.post('/tests/:id/assign', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), validate(assignLabTestValidation), labController.assignToLabCenter);

// Patient lab tests by Health ID
router.get('/patient/:healthId/tests', authorize(UserRole.LAB_TECHNICIAN, UserRole.DOCTOR), labController.getPatientLabTestsByHealthId);

// Patient lab tests by Patient ID
router.get('/patient/:patientId/history', authorize(UserRole.DOCTOR, UserRole.LAB_TECHNICIAN, UserRole.PATIENT), labController.getPatientLabTests);

export default router;
