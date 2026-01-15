import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as consentController from '../controllers/consent.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const grantConsentValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('grantedTo').notEmpty().withMessage('Provider ID is required'),
  body('grantedToType').isIn(['doctor', 'hospital', 'pharmacy', 'lab']).withMessage('Invalid provider type'),
  body('scope').isObject().withMessage('Scope is required')
];

const grantFullConsentValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('providerType').isIn(['doctor', 'hospital', 'pharmacy', 'lab']).withMessage('Invalid provider type')
];

const emergencyAccessValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('reason').notEmpty().withMessage('Reason for emergency access is required')
];

const checkConsentValidation = [
  query('patientId').notEmpty().withMessage('Patient ID is required'),
  query('providerId').notEmpty().withMessage('Provider ID is required')
];

// Routes
router.post('/grant', authorize(UserRole.PATIENT, UserRole.ADMIN), validate(grantConsentValidation), consentController.grantConsent);

router.post('/grant-full', authorize(UserRole.PATIENT, UserRole.ADMIN), validate(grantFullConsentValidation), consentController.grantFullConsent);

router.post('/emergency', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), validate(emergencyAccessValidation), consentController.grantEmergencyAccess);

router.post('/:consentId/revoke', authorize(UserRole.PATIENT, UserRole.ADMIN), consentController.revokeConsent);

router.get('/check', validate(checkConsentValidation), consentController.checkConsent);

router.get('/patient/:patientId', consentController.getPatientConsents);

router.get('/patient/:patientId/access-logs', authorize(UserRole.PATIENT, UserRole.ADMIN), consentController.getPatientAccessLogs);

export default router;
