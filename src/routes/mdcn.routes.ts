import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as mdcnController from '../controllers/mdcn.controller.js';

const router = Router();

// Public routes
router.post('/seed', mdcnController.seedMDCNRecords);
router.get('/verify/:mdcnNumber', mdcnController.verifyMDCN);
router.get('/sample-numbers', mdcnController.getSampleMDCNNumbers);

// Admin routes
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN), mdcnController.getAllMDCNRecords);

export default router;
