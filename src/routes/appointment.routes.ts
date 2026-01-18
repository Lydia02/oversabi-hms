import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create appointment
router.post(
  '/',
  appointmentController.createAppointment.bind(appointmentController)
);

// Get appointment by ID
router.get(
  '/:id',
  appointmentController.getAppointmentById.bind(appointmentController)
);

// Update appointment
router.patch(
  '/:id',
  appointmentController.updateAppointment.bind(appointmentController)
);

// Start appointment
router.post(
  '/:id/start',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  appointmentController.startAppointment.bind(appointmentController)
);

// Complete appointment
router.post(
  '/:id/complete',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  appointmentController.completeAppointment.bind(appointmentController)
);

// Cancel appointment
router.post(
  '/:id/cancel',
  appointmentController.cancelAppointment.bind(appointmentController)
);

// Mark as no-show
router.post(
  '/:id/no-show',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  appointmentController.markNoShow.bind(appointmentController)
);

// Get appointments by patient
router.get(
  '/patient/:patientId',
  appointmentController.getPatientAppointments.bind(appointmentController)
);

// Get upcoming appointments for patient
router.get(
  '/patient/:patientId/upcoming',
  appointmentController.getUpcomingAppointments.bind(appointmentController)
);

// Get appointments by doctor
router.get(
  '/doctor/:doctorId',
  appointmentController.getDoctorAppointments.bind(appointmentController)
);

// Get today's appointments for doctor
router.get(
  '/doctor/:doctorId/today',
  appointmentController.getTodaysAppointments.bind(appointmentController)
);

// Get appointments by hospital
router.get(
  '/hospital/:hospitalId',
  appointmentController.getHospitalAppointments.bind(appointmentController)
);

// Get today's appointments for hospital
router.get(
  '/hospital/:hospitalId/today',
  appointmentController.getTodaysHospitalAppointments.bind(appointmentController)
);

export default router;
