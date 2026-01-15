import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as visitController from '../controllers/visit.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createVisitValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('hospitalId').notEmpty().withMessage('Hospital ID is required'),
  body('chiefComplaint').notEmpty().withMessage('Chief complaint is required'),
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required')
];

const vitalsValidation = [
  body('bloodPressure').optional().isString(),
  body('heartRate').optional().isNumeric(),
  body('temperature').optional().isNumeric(),
  body('weight').optional().isNumeric(),
  body('height').optional().isNumeric(),
  body('oxygenSaturation').optional().isNumeric()
];

const diagnosisValidation = [
  body('code').notEmpty().withMessage('Diagnosis code is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity')
];

// Routes
router.post('/', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), validate(createVisitValidation), visitController.createVisit);

router.get('/hospital/:hospitalId', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), visitController.getHospitalVisits);

router.get('/doctor/:doctorId/today', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), visitController.getDoctorTodayVisits);

router.get('/:id', visitController.getVisitById);

router.get('/:id/details', visitController.getVisitWithDetails);

router.patch('/:id', authorize(UserRole.DOCTOR), visitController.updateVisit);

router.post('/:id/start', authorize(UserRole.DOCTOR), visitController.startVisit);

router.post('/:id/complete', authorize(UserRole.DOCTOR), visitController.completeVisit);

router.post('/:id/cancel', authorize(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN), visitController.cancelVisit);

router.post('/:id/vitals', authorize(UserRole.DOCTOR), validate(vitalsValidation), visitController.recordVitalSigns);

router.post('/:id/diagnosis', authorize(UserRole.DOCTOR), validate(diagnosisValidation), visitController.addDiagnosis);

export default router;
