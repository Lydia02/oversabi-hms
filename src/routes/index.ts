import { Router } from 'express';
import authRoutes from './auth.routes.js';
import medicalReportRoutes from './medicalReport.routes.js';
import patientReportRoutes from './patientReport.routes.js';
import mdcnRoutes from './mdcn.routes.js';
import seedRoutes from './seed.routes.js';
import documentRoutes from './document.routes.js';
import notificationRoutes from './notification.routes.js';

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
router.use('/medical-reports', medicalReportRoutes);
router.use('/patient-reports', patientReportRoutes);
router.use('/mdcn', mdcnRoutes);
router.use('/seed', seedRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
