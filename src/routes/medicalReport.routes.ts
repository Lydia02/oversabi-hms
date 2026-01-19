import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as medicalReportController from '../controllers/medicalReport.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createReportValidation = [
  body('patientUniqueId').notEmpty().withMessage('Patient unique ID is required'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('chiefComplaint').notEmpty().trim().withMessage('Chief complaint is required'),
  body('presentIllness').notEmpty().trim().withMessage('Present illness description is required'),
  body('diagnosis').notEmpty().trim().withMessage('Diagnosis is required'),
  body('treatment').notEmpty().trim().withMessage('Treatment is required'),
  body('diagnosisCode').optional().trim(),
  body('pastMedicalHistory').optional().trim(),
  body('familyHistory').optional().trim(),
  body('socialHistory').optional().trim(),
  body('physicalExamination').optional().trim(),
  body('labResults').optional().trim(),
  body('imaging').optional().trim(),
  body('recommendations').optional().trim(),
  body('followUpDate').optional().isISO8601().withMessage('Follow-up date must be a valid date'),
  body('status').optional().isIn(['draft', 'final', 'amended']).withMessage('Invalid status'),
  body('medications').optional().isArray().withMessage('Medications must be an array'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object')
];

const updateReportValidation = [
  body('title').optional().trim(),
  body('chiefComplaint').optional().trim(),
  body('presentIllness').optional().trim(),
  body('diagnosis').optional().trim(),
  body('treatment').optional().trim(),
  body('status').optional().isIn(['draft', 'final', 'amended']).withMessage('Invalid status')
];

// Doctor routes
router.post(
  '/',
  authorize(UserRole.DOCTOR),
  validate(createReportValidation),
  medicalReportController.createReport
);

router.get(
  '/my-reports',
  authorize(UserRole.DOCTOR),
  medicalReportController.getDoctorReports
);

router.get(
  '/search/:patientUniqueId',
  authorize(UserRole.DOCTOR),
  medicalReportController.searchPatientReports
);

router.get(
  '/:reportId',
  medicalReportController.getReportById
);

router.put(
  '/:reportId',
  authorize(UserRole.DOCTOR),
  validate(updateReportValidation),
  medicalReportController.updateReport
);

router.delete(
  '/:reportId',
  authorize(UserRole.DOCTOR),
  medicalReportController.deleteReport
);

export default router;
