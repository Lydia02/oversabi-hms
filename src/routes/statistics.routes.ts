import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get patient count graph (for dashboard)
router.get(
  '/patients/graph',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  statisticsController.getPatientCountGraph.bind(statisticsController)
);

// Get appointment count graph (for dashboard)
router.get(
  '/appointments/graph',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  statisticsController.getAppointmentCountGraph.bind(statisticsController)
);

// Get patient statistics
router.get(
  '/patient/:patientId',
  statisticsController.getPatientStatistics.bind(statisticsController)
);

// Get patient weekly stats
router.get(
  '/patient/:patientId/weekly',
  statisticsController.getPatientWeeklyStats.bind(statisticsController)
);

// Calculate patient daily stats
router.post(
  '/patient/:patientId/calculate',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  statisticsController.calculatePatientDailyStats.bind(statisticsController)
);

// Get doctor statistics
router.get(
  '/doctor/:doctorId',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  statisticsController.getDoctorStatistics.bind(statisticsController)
);

// Get doctor weekly stats
router.get(
  '/doctor/:doctorId/weekly',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  statisticsController.getDoctorWeeklyStats.bind(statisticsController)
);

// Calculate doctor daily stats
router.post(
  '/doctor/:doctorId/calculate',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  statisticsController.calculateDoctorDailyStats.bind(statisticsController)
);

export default router;
