import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get main dashboard statistics
router.get(
  '/stats',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  dashboardController.getDashboardStats.bind(dashboardController)
);

// Get today's appointments
router.get(
  '/appointments/today',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  dashboardController.getTodaysAppointments.bind(dashboardController)
);

// Get critical patients
router.get(
  '/patients/critical',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  dashboardController.getCriticalPatients.bind(dashboardController)
);

// Get department statistics for a hospital
router.get(
  '/departments/:hospitalId',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  dashboardController.getDepartmentStats.bind(dashboardController)
);

// Get doctor statistics
router.get(
  '/doctors/stats',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  dashboardController.getDoctorStats.bind(dashboardController)
);

// Get patient statistics
router.get(
  '/patients/stats',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  dashboardController.getPatientStats.bind(dashboardController)
);

export default router;
