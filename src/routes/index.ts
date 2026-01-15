import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import visitRoutes from './visit.routes.js';
import consentRoutes from './consent.routes.js';
import pharmacyRoutes from './pharmacy.routes.js';
import labRoutes from './lab.routes.js';

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

export default router;
