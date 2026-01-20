import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { DocumentType, UserRole } from '../types/index.js';
import { BadRequestError } from '../utils/errors.js';
import { getString } from '../utils/helpers.js';

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents for the logged-in user
 *     description: Retrieve all documents (prescriptions, lab results, imaging) for the logged-in user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [prescription, lab_result, xray, ultrasound, mri, ct_scan, medical_report, referral_letter, discharge_summary, other]
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function getMyDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as DocumentType | undefined;

    let result;
    if (type) {
      result = await documentService.getDocumentsByType(userId, type, page, limit);
    } else {
      result = await documentService.getUserDocuments(userId, role, page, limit);
    }

    res.json({
      success: true,
      data: result.documents,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /documents/{documentId}:
 *   get:
 *     summary: Get a specific document by ID
 *     description: Retrieve details of a specific document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No access to this document
 *       404:
 *         description: Document not found
 */
export async function getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documentId = getString(req.params.documentId);
    const userId = req.user!.userId;
    const role = req.user!.role;

    const document = await documentService.getDocumentById(documentId, userId, role);

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Upload a new document
 *     description: |
 *       Upload a new document (prescription, lab result, imaging, etc.)
 *       
 *       **Note:** This endpoint expects the file to be already uploaded to storage.
 *       You need to upload the file to your storage service first, then send the file URL here.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientUniqueId
 *               - fileName
 *               - originalFileName
 *               - fileSize
 *               - fileType
 *               - fileUrl
 *               - documentType
 *               - title
 *             properties:
 *               patientUniqueId:
 *                 type: string
 *                 description: Patient's unique ID (PAT_XXX)
 *                 example: "PAT_123"
 *               fileName:
 *                 type: string
 *                 example: "prescription_20240120.pdf"
 *               originalFileName:
 *                 type: string
 *                 example: "prescription.pdf"
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes
 *                 example: 204800
 *               fileType:
 *                 type: string
 *                 description: MIME type
 *                 example: "application/pdf"
 *               fileUrl:
 *                 type: string
 *                 description: URL to the uploaded file
 *                 example: "https://storage.example.com/documents/file123.pdf"
 *               documentType:
 *                 type: string
 *                 enum: [prescription, lab_result, xray, ultrasound, mri, ct_scan, medical_report, referral_letter, discharge_summary, other]
 *                 example: "prescription"
 *               title:
 *                 type: string
 *                 example: "Blood Pressure Medication"
 *               description:
 *                 type: string
 *                 example: "Prescription for hypertension management"
 *               relatedReportId:
 *                 type: string
 *                 description: ID of related medical report
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uploaderId = req.user!.userId;
    const uploaderRole = req.user!.role;
    const {
      patientUniqueId,
      fileName,
      originalFileName,
      fileSize,
      fileType,
      fileUrl,
      documentType,
      title,
      description,
      relatedReportId,
      isPublic
    } = req.body;

    // Get patient user details
    const patientSnapshot = await collections.users
      .where('uniqueId', '==', patientUniqueId)
      .limit(1)
      .get();

    if (patientSnapshot.empty) {
      throw new BadRequestError('Patient not found');
    }

    const patient = patientSnapshot.docs[0].data();

    // Get uploader details
    const uploaderSnapshot = await collections.users.doc(uploaderId).get();
    const uploader = uploaderSnapshot.data();

    const document = await documentService.createDocument({
      userId: patient.id,
      userUniqueId: patientUniqueId,
      uploadedBy: uploaderId,
      uploadedByUniqueId: uploader!.uniqueId,
      uploadedByName: `${uploader!.firstName} ${uploader!.lastName}`,
      uploadedByRole: uploaderRole,
      fileName,
      originalFileName,
      fileSize,
      fileType,
      fileUrl,
      documentType,
      title,
      description,
      relatedReportId,
      isPublic
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /documents/{documentId}:
 *   delete:
 *     summary: Delete a document
 *     description: Delete a document. Only the uploader or document owner can delete.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to delete
 *       404:
 *         description: Document not found
 */
export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documentId = getString(req.params.documentId);
    const userId = req.user!.userId;
    const role = req.user!.role;

    await documentService.deleteDocument(documentId, userId, role);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /documents/{documentId}/share:
 *   post:
 *     summary: Share a document with other users
 *     description: Share a document with specific users. Only owner or uploader can share.
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to share with
 *                 example: ["user123", "user456"]
 *     responses:
 *       200:
 *         description: Document shared successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No permission to share
 *       404:
 *         description: Document not found
 */
export async function shareDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documentId = getString(req.params.documentId);
    const userId = req.user!.userId;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestError('userIds must be a non-empty array');
    }

    const document = await documentService.shareDocument(documentId, userId, userIds);

    res.json({
      success: true,
      message: 'Document shared successfully',
      data: document
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /documents/shared:
 *   get:
 *     summary: Get documents shared with the logged-in user
 *     description: Retrieve all documents that have been shared with the current user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Shared documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function getSharedDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await documentService.getSharedDocuments(userId, page, limit);

    res.json({
      success: true,
      data: result.documents,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// Import collections at the top
import { collections } from '../config/firebase.js';
