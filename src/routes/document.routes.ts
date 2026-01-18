import { Router } from 'express';
import { documentController } from '../controllers/document.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create document
router.post(
  '/',
  documentController.createDocument.bind(documentController)
);

// Get my uploaded documents
router.get(
  '/my-uploads',
  documentController.getMyUploadedDocuments.bind(documentController)
);

// Get document by ID
router.get(
  '/:id',
  documentController.getDocumentById.bind(documentController)
);

// Update document metadata
router.patch(
  '/:id',
  documentController.updateDocument.bind(documentController)
);

// Delete document
router.delete(
  '/:id',
  documentController.deleteDocument.bind(documentController)
);

// Get documents by patient
router.get(
  '/patient/:patientId',
  documentController.getPatientDocuments.bind(documentController)
);

// Get recent documents for patient
router.get(
  '/patient/:patientId/recent',
  documentController.getRecentDocuments.bind(documentController)
);

// Get document counts by type for patient
router.get(
  '/patient/:patientId/counts',
  documentController.getDocumentCountsByType.bind(documentController)
);

// Get documents by visit
router.get(
  '/visit/:visitId',
  documentController.getVisitDocuments.bind(documentController)
);

export default router;
