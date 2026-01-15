import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as pharmacyController from '../controllers/pharmacy.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createPharmacyValidation = [
  body('name').notEmpty().withMessage('Pharmacy name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.country').notEmpty().withMessage('Country is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required')
];

const createPharmacistValidation = [
  body('pharmacyId').notEmpty().withMessage('Pharmacy ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

const createPharmacyVisitValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('pharmacyId').notEmpty().withMessage('Pharmacy ID is required'),
  body('pharmacistId').notEmpty().withMessage('Pharmacist ID is required'),
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required')
];

const dispenseValidation = [
  body('pharmacistId').notEmpty().withMessage('Pharmacist ID is required')
];

// Routes

// Pharmacy management
router.post('/', authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), validate(createPharmacyValidation), pharmacyController.createPharmacy);

router.get('/', pharmacyController.getPharmacies);

// Pharmacist routes
router.post('/pharmacist', authorize(UserRole.PHARMACIST, UserRole.ADMIN), validate(createPharmacistValidation), pharmacyController.createPharmacist);

router.get('/pharmacist/me', authorize(UserRole.PHARMACIST), pharmacyController.getMyProfile);

// Prescription routes
router.get('/prescriptions/:prescriptionId', authorize(UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.ADMIN), pharmacyController.getPrescriptionById);

router.post('/prescriptions/:prescriptionId/dispense', authorize(UserRole.PHARMACIST), validate(dispenseValidation), pharmacyController.dispensePrescription);

// Patient lookup by Health ID
router.get('/patient/:healthId/prescriptions', authorize(UserRole.PHARMACIST), pharmacyController.getPatientPrescriptionsByHealthId);

// Pharmacy visit routes (pharmacy-first flow)
router.post('/visits', authorize(UserRole.PHARMACIST), validate(createPharmacyVisitValidation), pharmacyController.createPharmacyVisit);

router.get('/visits/:visitId', authorize(UserRole.PHARMACIST, UserRole.DOCTOR), pharmacyController.getPharmacyVisitById);

router.patch('/visits/:visitId', authorize(UserRole.PHARMACIST), pharmacyController.updatePharmacyVisit);

router.get('/patient/:patientId/visits', authorize(UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.PATIENT), pharmacyController.getPatientPharmacyVisits);

// Pharmacy-specific routes (must be last due to :id parameter)
router.get('/:id', pharmacyController.getPharmacyById);

router.get('/:pharmacyId/pharmacists', pharmacyController.getPharmacistsByPharmacy);

router.get('/:pharmacyId/prescriptions/pending', authorize(UserRole.PHARMACIST), pharmacyController.getPendingPrescriptions);

export default router;
