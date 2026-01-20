import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import * as documentController from '../controllers/document.controller.js';

const router = Router();

// Validation rules
const uploadDocumentValidation = [
  body('patientUniqueId').notEmpty().withMessage('Patient unique ID is required'),
  body('fileName').notEmpty().withMessage('File name is required'),
  body('originalFileName').notEmpty().withMessage('Original file name is required'),
  body('fileSize').isInt({ min: 1 }).withMessage('File size must be a positive number'),
  body('fileType').notEmpty().withMessage('File type is required'),
  body('fileUrl').isURL().withMessage('Valid file URL is required'),
  body('documentType').isIn([
    'prescription',
    'lab_result',
    'xray',
    'ultrasound',
    'mri',
    'ct_scan',
    'medical_report',
    'referral_letter',
    'discharge_summary',
    'other'
  ]).withMessage('Invalid document type'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').optional().trim(),
  body('relatedReportId').optional().trim(),
  body('isPublic').optional().isBoolean()
];

const shareDocumentValidation = [
  body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
  body('userIds.*').isString().notEmpty().withMessage('Each user ID must be a non-empty string')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', documentController.getMyDocuments);
router.post('/', validate(uploadDocumentValidation), documentController.uploadDocument);
router.get('/shared', documentController.getSharedDocuments);
router.get('/:documentId', documentController.getDocumentById);
router.delete('/:documentId', documentController.deleteDocument);
router.post('/:documentId/share', validate(shareDocumentValidation), documentController.shareDocument);

export default router;
