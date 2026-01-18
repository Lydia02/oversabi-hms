import { Router } from 'express';
import { treatmentController } from '../controllers/treatment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===== TREATMENT ROUTES =====

// Create treatment
router.post(
  '/',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.createTreatment.bind(treatmentController)
);

// Get treatment by ID
router.get(
  '/:id',
  treatmentController.getTreatmentById.bind(treatmentController)
);

// Update treatment
router.patch(
  '/:id',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.updateTreatment.bind(treatmentController)
);

// Complete treatment
router.post(
  '/:id/complete',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.completeTreatment.bind(treatmentController)
);

// Discontinue treatment
router.post(
  '/:id/discontinue',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.discontinueTreatment.bind(treatmentController)
);

// Get patient treatments
router.get(
  '/patient/:patientId',
  treatmentController.getPatientTreatments.bind(treatmentController)
);

// Get active treatments for patient
router.get(
  '/patient/:patientId/active',
  treatmentController.getActiveTreatments.bind(treatmentController)
);

// Get doctor treatments
router.get(
  '/doctor/:doctorId',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.getDoctorTreatments.bind(treatmentController)
);

// ===== COMPLAINT ROUTES =====

// Create complaint
router.post(
  '/complaints',
  treatmentController.createComplaint.bind(treatmentController)
);

// Get pending complaints
router.get(
  '/complaints/pending',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.getPendingComplaints.bind(treatmentController)
);

// Get complaint by ID
router.get(
  '/complaints/:id',
  treatmentController.getComplaintById.bind(treatmentController)
);

// Get patient complaints
router.get(
  '/complaints/patient/:patientId',
  treatmentController.getPatientComplaints.bind(treatmentController)
);

// Review complaint
router.post(
  '/complaints/:id/review',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.reviewComplaint.bind(treatmentController)
);

// Address complaint
router.post(
  '/complaints/:id/address',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  treatmentController.addressComplaint.bind(treatmentController)
);

export default router;
