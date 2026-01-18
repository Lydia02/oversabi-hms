import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import visitRoutes from './visit.routes.js';
import consentRoutes from './consent.routes.js';
import pharmacyRoutes from './pharmacy.routes.js';
import labRoutes from './lab.routes.js';
import departmentRoutes from './department.routes.js';
import appointmentRoutes from './appointment.routes.js';
import documentRoutes from './document.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import consultationRoutes from './consultation.routes.js';
import messageRoutes from './message.routes.js';
import calendarRoutes from './calendar.routes.js';
import treatmentRoutes from './treatment.routes.js';
import statisticsRoutes from './statistics.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Oversabi HMS API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/visits', visitRoutes);
router.use('/consent', consentRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/lab', labRoutes);
router.use('/departments', departmentRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/consultations', consultationRoutes);
router.use('/messages', messageRoutes);
router.use('/calendar', calendarRoutes);
router.use('/treatments', treatmentRoutes);
router.use('/statistics', statisticsRoutes);

export default router;
