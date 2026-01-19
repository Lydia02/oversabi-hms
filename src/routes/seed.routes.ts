import { Router } from 'express';
import * as seedController from '../controllers/seed.controller.js';

const router = Router();

// Seed patients
router.post('/patients', seedController.seedPatients);

// Seed doctors
router.post('/doctors', seedController.seedDoctors);

// Seed medical reports
router.post('/reports', seedController.seedMedicalReports);

// Seed all data at once
router.post('/all', seedController.seedAll);

// Get sample credentials for testing
router.get('/credentials', seedController.getCredentials);

export default router;
