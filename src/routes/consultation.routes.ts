import { Router } from 'express';
import { consultationController } from '../controllers/consultation.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create consultation
router.post(
  '/',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  consultationController.createConsultation.bind(consultationController)
);

// Get consultation by ID
router.get(
  '/:id',
  consultationController.getConsultationById.bind(consultationController)
);

// Update consultation
router.patch(
  '/:id',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  consultationController.updateConsultation.bind(consultationController)
);

// Get consultations by patient
router.get(
  '/patient/:patientId',
  consultationController.getPatientConsultations.bind(consultationController)
);

// Get recent consultations for patient
router.get(
  '/patient/:patientId/recent',
  consultationController.getRecentConsultations.bind(consultationController)
);

// Get consultations by doctor
router.get(
  '/doctor/:doctorId',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  consultationController.getDoctorConsultations.bind(consultationController)
);

// Get follow-up required consultations for doctor
router.get(
  '/doctor/:doctorId/follow-ups',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  consultationController.getFollowUpRequired.bind(consultationController)
);

// Get consultations by visit
router.get(
  '/visit/:visitId',
  consultationController.getVisitConsultations.bind(consultationController)
);

// Get consultations by hospital
router.get(
  '/hospital/:hospitalId',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  consultationController.getHospitalConsultations.bind(consultationController)
);

// Get consultations by department
router.get(
  '/department/:departmentId',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  consultationController.getDepartmentConsultations.bind(consultationController)
);

export default router;
