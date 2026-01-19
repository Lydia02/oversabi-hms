import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import * as patientReportController from '../controllers/patientReport.controller.js';

const router = Router();

// All routes require authentication and patient role
router.use(authenticate);
router.use(authorize(UserRole.PATIENT));

// Get all reports for the logged-in patient
router.get('/', patientReportController.getMyReports);

// Download all reports as PDF
router.get('/download-all', patientReportController.downloadAllReportsPDF);

// Get a specific report
router.get('/:reportId', patientReportController.getMyReportById);

// Download a specific report as PDF
router.get('/:reportId/download', patientReportController.downloadReportPDF);

export default router;
